const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../utils/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Validation middleware
const reservationValidation = [
  body('vehicle_id')
    .isInt({ min: 1 })
    .withMessage('Valid vehicle ID is required'),
  body('start_date')
    .isISO8601()
    .withMessage('Valid start date is required'),
  body('end_date')
    .isISO8601()
    .withMessage('Valid end date is required'),
  body('total_cost')
    .isFloat({ min: 0 })
    .withMessage('Total cost must be a positive number')
];

// Get all reservations (Admin only)
router.get('/', [authenticateToken, requireAdmin], async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT 
        r.reservation_id,
        r.customer_id,
        r.vehicle_id,
        r.start_date,
        r.end_date,
        r.status,
        r.total_cost,
        r.created_at,
        c.name as customer_name,
        c.email as customer_email,
        v.make as vehicle_make,
        v.model as vehicle_model,
        v.year as vehicle_year,
        b.name as branch_name,
        b.location as branch_location,
        p.payment_id,
        p.payment_method,
        p.status as payment_status
      FROM reservations r
      JOIN customers c ON r.customer_id = c.customer_id
      JOIN vehicles v ON r.vehicle_id = v.vehicle_id
      JOIN branches b ON v.branch_id = b.branch_id
      LEFT JOIN payments p ON r.reservation_id = p.reservation_id
      ORDER BY r.created_at DESC
    `);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });

  } catch (error) {
    next(error);
  }
});

// Get user's reservations
router.get('/my', authenticateToken, async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT 
        r.reservation_id,
        r.vehicle_id,
        r.start_date,
        r.end_date,
        r.status,
        r.total_cost,
        r.created_at,
        v.make as vehicle_make,
        v.model as vehicle_model,
        v.year as vehicle_year,
        b.name as branch_name,
        b.location as branch_location,
        p.payment_method,
        p.status as payment_status
      FROM reservations r
      JOIN vehicles v ON r.vehicle_id = v.vehicle_id
      JOIN branches b ON v.branch_id = b.branch_id
      LEFT JOIN payments p ON r.reservation_id = p.reservation_id
      WHERE r.customer_id = $1
      ORDER BY r.created_at DESC
    `, [req.user.customer_id]);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });

  } catch (error) {
    next(error);
  }
});

// Get single reservation
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const reservationId = parseInt(req.params.id);

    if (isNaN(reservationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reservation ID'
      });
    }

    let queryText = `
      SELECT 
        r.reservation_id,
        r.customer_id,
        r.vehicle_id,
        r.start_date,
        r.end_date,
        r.status,
        r.total_cost,
        r.created_at,
        c.name as customer_name,
        c.email as customer_email,
        v.make as vehicle_make,
        v.model as vehicle_model,
        v.year as vehicle_year,
        v.daily_rate,
        b.name as branch_name,
        b.location as branch_location,
        b.contact_number as branch_contact,
        p.payment_id,
        p.payment_method,
        p.amount as payment_amount,
        p.payment_date,
        p.status as payment_status
      FROM reservations r
      JOIN customers c ON r.customer_id = c.customer_id
      JOIN vehicles v ON r.vehicle_id = v.vehicle_id
      JOIN branches b ON v.branch_id = b.branch_id
      LEFT JOIN payments p ON r.reservation_id = p.reservation_id
      WHERE r.reservation_id = $1
    `;

    const queryParams = [reservationId];

    // If not admin, only show user's own reservations
    if (req.user.role !== 'admin') {
      queryText += ' AND r.customer_id = $2';
      queryParams.push(req.user.customer_id);
    }

    const result = await db.query(queryText, queryParams);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    next(error);
  }
});

// Create new reservation
router.post('/', [authenticateToken, reservationValidation], async (req, res, next) => {
  const client = await db.getClient();
  
  try {
    await client.query('BEGIN');

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { vehicle_id, start_date, end_date, total_cost } = req.body;
    const customer_id = req.user.customer_id;

    // Validate dates
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Start date cannot be in the past'
      });
    }

    if (endDate <= startDate) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    // Check if vehicle exists and is available
    const vehicleResult = await client.query(
      'SELECT vehicle_id, availability, daily_rate FROM vehicles WHERE vehicle_id = $1',
      [vehicle_id]
    );

    if (vehicleResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    const vehicle = vehicleResult.rows[0];

    if (!vehicle.availability) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Vehicle is not available'
      });
    }

    // Check for conflicting reservations
    const conflictResult = await client.query(`
      SELECT reservation_id FROM reservations 
      WHERE vehicle_id = $1 
      AND status IN ('confirmed', 'pending')
      AND (
        (start_date <= $2 AND end_date > $2) OR
        (start_date < $3 AND end_date >= $3) OR
        (start_date >= $2 AND end_date <= $3)
      )
    `, [vehicle_id, start_date, end_date]);

    if (conflictResult.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Vehicle is already booked for the selected dates'
      });
    }

    // Verify total cost calculation
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const expectedCost = days * parseFloat(vehicle.daily_rate);
    
    if (Math.abs(total_cost - expectedCost) > 0.01) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Total cost calculation is incorrect'
      });
    }

    // Create reservation
    const reservationResult = await client.query(`
      INSERT INTO reservations (customer_id, vehicle_id, start_date, end_date, status, total_cost)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING reservation_id, customer_id, vehicle_id, start_date, end_date, status, total_cost, created_at
    `, [customer_id, vehicle_id, start_date, end_date, 'confirmed', total_cost]);

    await client.query('COMMIT');

    logger.info(`Reservation created by user ${req.user.email}: ID ${reservationResult.rows[0].reservation_id}`);

    res.status(201).json({
      success: true,
      message: 'Reservation created successfully',
      data: reservationResult.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

// Update reservation status (Admin only)
router.put('/:id', [authenticateToken, requireAdmin], async (req, res, next) => {
  try {
    const reservationId = parseInt(req.params.id);
    const { status } = req.body;

    if (isNaN(reservationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reservation ID'
      });
    }

    if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: pending, confirmed, cancelled, or completed'
      });
    }

    const result = await db.query(`
      UPDATE reservations 
      SET status = $1 
      WHERE reservation_id = $2
      RETURNING reservation_id, status
    `, [status, reservationId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    logger.info(`Reservation status updated by admin ${req.user.email}: ID ${reservationId} to ${status}`);

    res.json({
      success: true,
      message: 'Reservation status updated successfully',
      data: result.rows[0]
    });

  } catch (error) {
    next(error);
  }
});

// Cancel reservation
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const reservationId = parseInt(req.params.id);

    if (isNaN(reservationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reservation ID'
      });
    }

    let queryText = `
      UPDATE reservations 
      SET status = 'cancelled' 
      WHERE reservation_id = $1 AND status IN ('pending', 'confirmed')
    `;
    const queryParams = [reservationId];

    // If not admin, only allow canceling own reservations
    if (req.user.role !== 'admin') {
      queryText += ' AND customer_id = $2';
      queryParams.push(req.user.customer_id);
    }

    queryText += ' RETURNING reservation_id, status';

    const result = await db.query(queryText, queryParams);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found or cannot be cancelled'
      });
    }

    logger.info(`Reservation cancelled by user ${req.user.email}: ID ${reservationId}`);

    res.json({
      success: true,
      message: 'Reservation cancelled successfully',
      data: result.rows[0]
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;