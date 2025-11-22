const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../utils/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Validation middleware
const branchValidation = [
  body('name')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Branch name is required'),
  body('location')
    .trim()
    .isLength({ min: 5 })
    .withMessage('Location must be at least 5 characters long'),
  body('phone')
    .optional()
    .trim()
    .isLength({ min: 10, max: 20 })
    .withMessage('Phone number must be 10-20 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address must be less than 500 characters'),
  body('manager_name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Manager name must be less than 100 characters'),
  body('opening_hours')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Opening hours must be less than 100 characters')
];

// Get all branches
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT 
        branch_id,
        name,
        location,
        phone,
        email,
        address,
        manager_name,
        opening_hours,
        created_at
      FROM branches
      ORDER BY name
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

// Get single branch by ID
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const branchId = parseInt(req.params.id);

    if (isNaN(branchId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid branch ID'
      });
    }

    const result = await db.query(`
      SELECT 
        b.branch_id,
        b.name,
        b.location,
        b.phone,
        b.email,
        b.address,
        b.manager_name,
        b.opening_hours,
        b.created_at,
        COUNT(v.vehicle_id) as vehicle_count
      FROM branches b
      LEFT JOIN vehicles v ON b.branch_id = v.branch_id
      WHERE b.branch_id = $1
      GROUP BY b.branch_id, b.name, b.location, b.phone, b.email, b.address, b.manager_name, b.opening_hours, b.created_at
    `, [branchId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
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

// Create new branch (Admin only)
router.post('/', [authenticateToken, requireAdmin, branchValidation], async (req, res, next) => {
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

    const { name, location, phone, email, address, manager_name, opening_hours } = req.body;

    // Check if branch name already exists
    const existingBranch = await db.query(
      'SELECT branch_id FROM branches WHERE LOWER(name) = LOWER($1)',
      [name]
    );

    if (existingBranch.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Branch name already exists'
      });
    }

    // Insert new branch
    const result = await db.query(`
      INSERT INTO branches (name, location, phone, email, address, manager_name, opening_hours)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING branch_id, name, location, phone, email, address, manager_name, opening_hours, created_at
    `, [name, location, phone || null, email || null, address || null, manager_name || null, opening_hours || null]);

    logger.info(`Branch created by admin ${req.user.email}: ${name}`);

    res.status(201).json({
      success: true,
      message: 'Branch created successfully',
      data: result.rows[0]
    });

  } catch (error) {
    next(error);
  }
});

// Update branch (Admin only)
router.put('/:id', [authenticateToken, requireAdmin, branchValidation], async (req, res, next) => {
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

    const branchId = parseInt(req.params.id);
    const { name, location, phone, email, address, manager_name, opening_hours } = req.body;

    if (isNaN(branchId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid branch ID'
      });
    }

    // Check if branch exists
    const branchCheck = await db.query(
      'SELECT branch_id FROM branches WHERE branch_id = $1',
      [branchId]
    );

    if (branchCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }

    // Check if branch name already exists for different branch
    const existingBranch = await db.query(
      'SELECT branch_id FROM branches WHERE LOWER(name) = LOWER($1) AND branch_id != $2',
      [name, branchId]
    );

    if (existingBranch.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Branch name already exists'
      });
    }

    // Update branch
    const result = await db.query(`
      UPDATE branches 
      SET name = $1, location = $2, phone = $3, email = $4, address = $5, manager_name = $6, opening_hours = $7
      WHERE branch_id = $8
      RETURNING branch_id, name, location, phone, email, address, manager_name, opening_hours, created_at
    `, [name, location, phone || null, email || null, address || null, manager_name || null, opening_hours || null, branchId]);

    logger.info(`Branch updated by admin ${req.user.email}: ID ${branchId}`);

    res.json({
      success: true,
      message: 'Branch updated successfully',
      data: result.rows[0]
    });

  } catch (error) {
    next(error);
  }
});

// Delete branch (Admin only)
router.delete('/:id', [authenticateToken, requireAdmin], async (req, res, next) => {
  try {
    const branchId = parseInt(req.params.id);

    if (isNaN(branchId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid branch ID'
      });
    }

    // Check if branch has vehicles
    const vehicleCheck = await db.query(`
      SELECT vehicle_id FROM vehicles WHERE branch_id = $1
    `, [branchId]);

    if (vehicleCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete branch with associated vehicles'
      });
    }

    // Delete branch
    const result = await db.query(
      'DELETE FROM branches WHERE branch_id = $1 RETURNING branch_id, name',
      [branchId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }

    logger.info(`Branch deleted by admin ${req.user.email}: ID ${branchId}`);

    res.json({
      success: true,
      message: 'Branch deleted successfully',
      data: result.rows[0]
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;