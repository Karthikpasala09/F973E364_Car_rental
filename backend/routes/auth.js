const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../utils/database');
const logger = require('../utils/logger');

const router = express.Router();

// Validation middleware
const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters long'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('phone')
    .trim()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  body('address')
    .trim()
    .isLength({ min: 5 })
    .withMessage('Address must be at least 5 characters long')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Helper function to generate JWT
const generateToken = (user) => {
  return jwt.sign(
    {
      customer_id: user.customer_id,
      email: user.email,
      name: user.name,
      role: user.role || 'customer'
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '24h' }
  );
};

// Register new user
router.post('/register', registerValidation, async (req, res, next) => {
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

    const { name, email, password, phone, address } = req.body;

    // Check if user already exists
    const existingUser = await db.query(
      'SELECT customer_id FROM customers WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const result = await db.query(
      `INSERT INTO customers (name, email, password_hash, phone, address) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING customer_id, name, email, phone, address`,
      [name, email, hashedPassword, phone, address]
    );

    const user = result.rows[0];

    // Generate JWT token
    const token = generateToken(user);

    logger.info(`New user registered: ${email}`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        customer_id: user.customer_id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: 'customer'
      }
    });

  } catch (error) {
    next(error);
  }
});

// Login user
router.post('/login', loginValidation, async (req, res, next) => {
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

    const { email, password } = req.body;

    // Find user by email
    const result = await db.query(
      'SELECT customer_id, name, email, password_hash, phone, address, role FROM customers WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const user = result.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = generateToken(user);

    logger.info(`User logged in: ${email}`);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        customer_id: user.customer_id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role || 'customer'
      }
    });

  } catch (error) {
    next(error);
  }
});

// Refresh token
router.post('/refresh', async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token is required'
      });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({
          success: false,
          message: 'Invalid token'
        });
      }

      // Get fresh user data
      const result = await db.query(
        'SELECT customer_id, name, email, phone, address, role FROM customers WHERE customer_id = $1',
        [decoded.customer_id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const user = result.rows[0];
      const newToken = generateToken(user);

      res.json({
        success: true,
        message: 'Token refreshed',
        token: newToken,
        user: {
          customer_id: user.customer_id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          address: user.address,
          role: user.role || 'customer'
        }
      });
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;