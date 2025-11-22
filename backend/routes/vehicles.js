const express = require('express');
const { body, validationResult, query } = require('express-validator');
const db = require('../utils/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Validation middleware
const vehicleValidation = [
  body('make')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Make is required'),
  body('model')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Model is required'),
  body('year')
    .isInt({ min: 1950, max: new Date().getFullYear() + 1 })
    .withMessage('Year must be between 1950 and next year'),
  body('color')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Color cannot be empty'),
  body('license_plate')
    .trim()
    .isLength({ min: 1 })
    .withMessage('License plate is required'),
  body('fuel_type')
    .optional()
    .isIn(['petrol', 'diesel', 'hybrid', 'electric'])
    .withMessage('Fuel type must be petrol, diesel, hybrid, or electric'),
  body('transmission')
    .optional()
    .isIn(['manual', 'automatic'])
    .withMessage('Transmission must be manual or automatic'),
  body('seats')
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage('Seats must be between 1 and 12'),
  body('branch_id')
    .isInt({ min: 1 })
    .withMessage('Valid branch ID is required'),
  body('daily_rate')
    .isFloat({ min: 0 })
    .withMessage('Daily rate must be a positive number'),
  body('status')
    .optional()
    .isIn(['available', 'rented', 'maintenance', 'retired'])
    .withMessage('Status must be available, rented, maintenance, or retired'),
  body('mileage')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Mileage must be a positive number')
];

const queryValidation = [
  query('branch_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Branch ID must be a positive integer'),
  query('make')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Make filter cannot be empty'),
  query('status')
    .optional()
    .isIn(['available', 'rented', 'maintenance', 'retired', 'all'])
    .withMessage('Status must be available, rented, maintenance, retired, or all'),
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Search term cannot be empty')
];

// Get all vehicles with filters
router.get('/', [authenticateToken, queryValidation], async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { branch_id, make, status, search } = req.query;

    let queryText = `
      SELECT 
        v.vehicle_id,
        v.make,
        v.model,
        v.year,
        v.color,
        v.license_plate,
        v.fuel_type,
        v.transmission,
        v.seats,
        v.branch_id,
        v.status,
        v.daily_rate,
        v.mileage,
        v.last_service_date,
        b.name as branch_name,
        b.location as branch_location,
        b.phone as branch_contact
      FROM vehicles v
      JOIN branches b ON v.branch_id = b.branch_id
      WHERE 1=1
    `;

    const queryParams = [];
    let paramCount = 0;

    // Add filters
    if (branch_id) {
      paramCount++;
      queryText += ` AND v.branch_id = $${paramCount}`;
      queryParams.push(branch_id);
    }

    if (make) {
      paramCount++;
      queryText += ` AND LOWER(v.make) = LOWER($${paramCount})`;
      queryParams.push(make);
    }

    if (status && status !== 'all') {
      paramCount++;
      queryText += ` AND v.status = $${paramCount}`;
      queryParams.push(status);
    }

    if (search) {
      paramCount++;
      queryText += ` AND (
        LOWER(v.make) LIKE LOWER($${paramCount}) OR 
        LOWER(v.model) LIKE LOWER($${paramCount}) OR
        LOWER(b.name) LIKE LOWER($${paramCount})
      )`;
      queryParams.push(`%${search}%`);
    }

    queryText += ' ORDER BY v.make, v.model, v.year';

    const result = await db.query(queryText, queryParams);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });

  } catch (error) {
    next(error);
  }
});

// Get single vehicle by ID
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const vehicleId = parseInt(req.params.id);

    if (isNaN(vehicleId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vehicle ID'
      });
    }

    const result = await db.query(`
      SELECT 
        v.vehicle_id,
        v.make,
        v.model,
        v.year,
        v.color,
        v.license_plate,
        v.fuel_type,
        v.transmission,
        v.seats,
        v.branch_id,
        v.status,
        v.daily_rate,
        v.mileage,
        v.last_service_date,
        b.name as branch_name,
        b.location as branch_location,
        b.phone as branch_contact,
        b.email as branch_email
      FROM vehicles v
      JOIN branches b ON v.branch_id = b.branch_id
      WHERE v.vehicle_id = $1
    `, [vehicleId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
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

// Create new vehicle (Admin only)
router.post('/', [authenticateToken, requireAdmin, vehicleValidation], async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { 
      make, 
      model, 
      year, 
      color, 
      license_plate, 
      fuel_type = 'petrol',
      transmission = 'manual',
      seats = 5,
      branch_id, 
      daily_rate, 
      status = 'available',
      mileage = 0
    } = req.body;

    // Check if branch exists
    const branchCheck = await db.query(
      'SELECT branch_id FROM branches WHERE branch_id = $1',
      [branch_id]
    );

    if (branchCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid branch ID'
      });
    }

    // Insert new vehicle
    const result = await db.query(`
      INSERT INTO vehicles (make, model, year, color, license_plate, fuel_type, transmission, seats, branch_id, daily_rate, status, mileage)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING vehicle_id, make, model, year, color, license_plate, fuel_type, transmission, seats, branch_id, daily_rate, status, mileage
    `, [make, model, year, color, license_plate, fuel_type, transmission, seats, branch_id, daily_rate, status, mileage]);

    logger.info(`Vehicle created by admin ${req.user.email}: ${make} ${model}`);

    res.status(201).json({
      success: true,
      message: 'Vehicle created successfully',
      data: result.rows[0]
    });

  } catch (error) {
    next(error);
  }
});

// Update vehicle (Admin only)
router.put('/:id', [authenticateToken, requireAdmin, vehicleValidation], async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const vehicleId = parseInt(req.params.id);
    const { 
      make, 
      model, 
      year, 
      color, 
      license_plate, 
      fuel_type,
      transmission,
      seats,
      branch_id, 
      daily_rate, 
      status,
      mileage
    } = req.body;

    if (isNaN(vehicleId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vehicle ID'
      });
    }

    // Check if vehicle exists
    const vehicleCheck = await db.query(
      'SELECT vehicle_id FROM vehicles WHERE vehicle_id = $1',
      [vehicleId]
    );

    if (vehicleCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Check if branch exists
    const branchCheck = await db.query(
      'SELECT branch_id FROM branches WHERE branch_id = $1',
      [branch_id]
    );

    if (branchCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid branch ID'
      });
    }

    // Update vehicle
    const result = await db.query(`
      UPDATE vehicles 
      SET make = $1, model = $2, year = $3, color = $4, license_plate = $5, fuel_type = $6, 
          transmission = $7, seats = $8, branch_id = $9, daily_rate = $10, status = $11, mileage = $12, 
          updated_at = CURRENT_TIMESTAMP
      WHERE vehicle_id = $13
      RETURNING vehicle_id, make, model, year, color, license_plate, fuel_type, transmission, seats, branch_id, daily_rate, status, mileage, updated_at
    `, [make, model, year, color, license_plate, fuel_type, transmission, seats, branch_id, daily_rate, status, mileage, vehicleId]);

    logger.info(`Vehicle updated by admin ${req.user.email}: ID ${vehicleId}`);

    res.json({
      success: true,
      message: 'Vehicle updated successfully',
      data: result.rows[0]
    });

  } catch (error) {
    next(error);
  }
});

// Delete vehicle (Admin only)
router.delete('/:id', [authenticateToken, requireAdmin], async (req, res, next) => {
  try {
    const vehicleId = parseInt(req.params.id);

    if (isNaN(vehicleId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vehicle ID'
      });
    }

    // Check if vehicle has active reservations
    const reservationCheck = await db.query(`
      SELECT reservation_id FROM reservations 
      WHERE vehicle_id = $1 AND status IN ('confirmed', 'pending')
    `, [vehicleId]);

    if (reservationCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete vehicle with active reservations'
      });
    }

    // Delete vehicle
    const result = await db.query(
      'DELETE FROM vehicles WHERE vehicle_id = $1 RETURNING vehicle_id, make, model',
      [vehicleId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    logger.info(`Vehicle deleted by admin ${req.user.email}: ID ${vehicleId}`);

    res.json({
      success: true,
      message: 'Vehicle deleted successfully',
      data: result.rows[0]
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;