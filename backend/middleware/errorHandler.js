const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error(`Error ${err.status || 500}: ${err.message}`, { 
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  // Default error
  let error = { ...err };
  error.message = err.message;

  // PostgreSQL errors
  if (err.code === '23505') {
    // Duplicate key error
    const message = 'Duplicate entry found';
    error = { message, status: 400 };
  }

  if (err.code === '23503') {
    // Foreign key constraint error
    const message = 'Referenced record not found';
    error = { message, status: 400 };
  }

  if (err.code === '23502') {
    // Not null constraint error
    const message = 'Required field is missing';
    error = { message, status: 400 };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, status: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, status: 401 };
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    const message = 'Invalid input data';
    error = { message, status: 400 };
  }

  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;