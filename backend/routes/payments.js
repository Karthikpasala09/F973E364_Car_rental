const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../utils/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Validation middleware
const paymentValidation = [
  body('reservation_id')
    .isInt({ min: 1 })
    .withMessage('Valid reservation ID is required'),
  body('amount')
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),
  body('payment_method')
    .isIn(['card', 'debit', 'cash', 'bank_transfer'])
    .withMessage('Invalid payment method'),
  body('payment_date')
    .isISO8601()
    .withMessage('Valid payment date is required'),
  body('txn_ref')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Transaction reference cannot be empty')
];

// Get all payments (Admin only)
router.get('/', [authenticateToken, requireAdmin], async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT 
        p.payment_id,
        p.reservation_id,
        p.amount,
        p.payment_date,
        p.payment_method,
        p.status,
        p.txn_ref,
        p.created_at,
        r.customer_id,
        r.start_date,
        r.end_date,
        r.total_cost,
        c.name as customer_name,
        c.email as customer_email,
        v.make as vehicle_make,
        v.model as vehicle_model
      FROM payments p
      JOIN reservations r ON p.reservation_id = r.reservation_id
      JOIN customers c ON r.customer_id = c.customer_id
      JOIN vehicles v ON r.vehicle_id = v.vehicle_id
      ORDER BY p.created_at DESC
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

// Get single payment
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const paymentId = parseInt(req.params.id);

    if (isNaN(paymentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment ID'
      });
    }

    let queryText = `
      SELECT 
        p.payment_id,
        p.reservation_id,
        p.amount,
        p.payment_date,
        p.payment_method,
        p.status,
        p.txn_ref,
        p.created_at,
        r.customer_id,
        r.start_date,
        r.end_date,
        r.total_cost,
        c.name as customer_name,
        c.email as customer_email,
        v.make as vehicle_make,
        v.model as vehicle_model,
        v.year as vehicle_year
      FROM payments p
      JOIN reservations r ON p.reservation_id = r.reservation_id
      JOIN customers c ON r.customer_id = c.customer_id
      JOIN vehicles v ON r.vehicle_id = v.vehicle_id
      WHERE p.payment_id = $1
    `;

    const queryParams = [paymentId];

    // If not admin, only show payments for user's own reservations
    if (req.user.role !== 'admin') {
      queryText += ' AND r.customer_id = $2';
      queryParams.push(req.user.customer_id);
    }

    const result = await db.query(queryText, queryParams);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
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

// Create new payment
router.post('/', [authenticateToken, paymentValidation], async (req, res, next) => {
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

    const { reservation_id, amount, payment_method, payment_date, txn_ref, status = 'completed' } = req.body;

    // Verify reservation exists and belongs to user (or admin)
    let reservationQuery = `
      SELECT r.reservation_id, r.customer_id, r.total_cost, r.status as reservation_status
      FROM reservations r
      WHERE r.reservation_id = $1
    `;
    
    const reservationParams = [reservation_id];

    if (req.user.role !== 'admin') {
      reservationQuery += ' AND r.customer_id = $2';
      reservationParams.push(req.user.customer_id);
    }

    const reservationResult = await client.query(reservationQuery, reservationParams);

    if (reservationResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    const reservation = reservationResult.rows[0];

    // Check if payment already exists for this reservation
    const existingPayment = await client.query(
      'SELECT payment_id FROM payments WHERE reservation_id = $1',
      [reservation_id]
    );

    if (existingPayment.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Payment already exists for this reservation'
      });
    }

    // Verify payment amount matches reservation total
    if (Math.abs(amount - parseFloat(reservation.total_cost)) > 0.01) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Payment amount does not match reservation total'
      });
    }

    // Generate transaction reference if not provided
    const transactionRef = txn_ref || `TXN_${Date.now()}_${reservation_id}`;

    // Create payment
    const paymentResult = await client.query(`
      INSERT INTO payments (reservation_id, amount, payment_date, payment_method, status, txn_ref)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING payment_id, reservation_id, amount, payment_date, payment_method, status, txn_ref, created_at
    `, [reservation_id, amount, payment_date, payment_method, status, transactionRef]);

    await client.query('COMMIT');

    logger.info(`Payment created by user ${req.user.email}: ID ${paymentResult.rows[0].payment_id} for reservation ${reservation_id}`);

    res.status(201).json({
      success: true,
      message: 'Payment processed successfully',
      data: paymentResult.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

// Update payment status (Admin only)
router.put('/:id', [authenticateToken, requireAdmin], async (req, res, next) => {
  try {
    const paymentId = parseInt(req.params.id);
    const { status } = req.body;

    if (isNaN(paymentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment ID'
      });
    }

    if (!['pending', 'completed', 'failed', 'refunded'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: pending, completed, failed, or refunded'
      });
    }

    const result = await db.query(`
      UPDATE payments 
      SET status = $1 
      WHERE payment_id = $2
      RETURNING payment_id, reservation_id, amount, status, txn_ref
    `, [status, paymentId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    logger.info(`Payment status updated by admin ${req.user.email}: ID ${paymentId} to ${status}`);

    res.json({
      success: true,
      message: 'Payment status updated successfully',
      data: result.rows[0]
    });

  } catch (error) {
    next(error);
  }
});

// Get user's payment history
router.get('/user/history', authenticateToken, async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT 
        p.payment_id,
        p.reservation_id,
        p.amount,
        p.payment_date,
        p.payment_method,
        p.status,
        p.txn_ref,
        r.start_date,
        r.end_date,
        v.make as vehicle_make,
        v.model as vehicle_model,
        v.year as vehicle_year,
        b.name as branch_name
      FROM payments p
      JOIN reservations r ON p.reservation_id = r.reservation_id
      JOIN vehicles v ON r.vehicle_id = v.vehicle_id
      JOIN branches b ON v.branch_id = b.branch_id
      WHERE r.customer_id = $1
      ORDER BY p.created_at DESC
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

module.exports = router;