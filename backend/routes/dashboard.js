const express = require('express');
const db = require('../utils/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get admin dashboard statistics
router.get('/admin/stats', [authenticateToken, requireAdmin], async (req, res, next) => {
  try {
    // Get various statistics in parallel
    const [
      totalReservationsResult,
      totalCustomersResult,
      totalVehiclesResult,
      totalBranchesResult,
      totalRevenueResult,
      activeReservationsResult,
      monthlyRevenueResult,
      vehicleUtilizationResult,
      topVehiclesResult
    ] = await Promise.all([
      // Total reservations
      db.query('SELECT COUNT(*) as count FROM reservations'),
      
      // Total customers
      db.query('SELECT COUNT(*) as count FROM customers'),
      
      // Total vehicles
      db.query('SELECT COUNT(*) as count FROM vehicles'),
      
      // Total branches
      db.query('SELECT COUNT(*) as count FROM branches'),
      
      // Total revenue from completed payments
      db.query(`
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM payments 
        WHERE status = 'completed'
      `),
      
      // Active reservations
      db.query(`
        SELECT COUNT(*) as count 
        FROM reservations 
        WHERE status = 'active' OR status = 'confirmed'
      `),
      
      // Monthly revenue for the last 12 months
      db.query(`
        SELECT 
          DATE_TRUNC('month', p.payment_date) as month,
          SUM(p.amount) as revenue
        FROM payments p
        WHERE p.status = 'completed' 
          AND p.payment_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '12 months')
        GROUP BY DATE_TRUNC('month', p.payment_date)
        ORDER BY month ASC
      `),
      
      // Vehicle utilization rate
      db.query(`
        SELECT 
          v.vehicle_id,
          v.make,
          v.model,
          v.year,
          COUNT(r.reservation_id) as total_rentals,
          ROUND(
            (COUNT(r.reservation_id)::DECIMAL / 
            GREATEST(DATE_PART('day', CURRENT_DATE - v.created_at), 1)) * 100, 
            2
          ) as utilization_rate
        FROM vehicles v
        LEFT JOIN reservations r ON v.vehicle_id = r.vehicle_id 
          AND r.status IN ('completed', 'active', 'confirmed')
        WHERE v.status = 'available'
        GROUP BY v.vehicle_id, v.make, v.model, v.year, v.created_at
        ORDER BY utilization_rate DESC
        LIMIT 10
      `),
      
      // Top rented vehicles
      db.query(`
        SELECT 
          v.make,
          v.model,
          v.year,
          COUNT(r.reservation_id) as rental_count,
          SUM(r.total_cost) as total_revenue
        FROM vehicles v
        JOIN reservations r ON v.vehicle_id = r.vehicle_id
        WHERE r.status IN ('completed', 'active', 'confirmed')
        GROUP BY v.make, v.model, v.year
        ORDER BY rental_count DESC
        LIMIT 10
      `)
    ]);

    res.json({
      success: true,
      data: {
        totals: {
          reservations: parseInt(totalReservationsResult.rows[0].count),
          customers: parseInt(totalCustomersResult.rows[0].count),
          vehicles: parseInt(totalVehiclesResult.rows[0].count),
          branches: parseInt(totalBranchesResult.rows[0].count),
          revenue: parseFloat(totalRevenueResult.rows[0].total || 0),
          activeReservations: parseInt(activeReservationsResult.rows[0].count)
        },
        monthlyRevenue: monthlyRevenueResult.rows.map(row => ({
          month: row.month,
          revenue: parseFloat(row.revenue)
        })),
        vehicleUtilization: vehicleUtilizationResult.rows,
        topVehicles: topVehiclesResult.rows.map(row => ({
          ...row,
          rental_count: parseInt(row.rental_count),
          total_revenue: parseFloat(row.total_revenue)
        }))
      }
    });

  } catch (error) {
    next(error);
  }
});

// Get user dashboard statistics
router.get('/user/stats', authenticateToken, async (req, res, next) => {
  try {
    const customerId = req.user.customer_id;

    const [
      totalReservationsResult,
      upcomingReservationsResult,
      completedReservationsResult,
      totalSpentResult,
      recentReservationsResult
    ] = await Promise.all([
      // Total reservations
      db.query('SELECT COUNT(*) as count FROM reservations WHERE customer_id = $1', [customerId]),
      
      // Upcoming reservations
      db.query(`
        SELECT COUNT(*) as count 
        FROM reservations 
        WHERE customer_id = $1 
          AND status IN ('confirmed', 'active')
          AND start_date > CURRENT_DATE
      `, [customerId]),
      
      // Completed reservations
      db.query(`
        SELECT COUNT(*) as count 
        FROM reservations 
        WHERE customer_id = $1 AND status = 'completed'
      `, [customerId]),
      
      // Total spent
      db.query(`
        SELECT COALESCE(SUM(p.amount), 0) as total
        FROM payments p
        JOIN reservations r ON p.reservation_id = r.reservation_id
        WHERE r.customer_id = $1 AND p.status = 'completed'
      `, [customerId]),
      
      // Recent reservations with vehicle details
      db.query(`
        SELECT 
          r.reservation_id,
          r.start_date,
          r.end_date,
          r.status,
          r.total_cost,
          v.make,
          v.model,
          v.year,
          b.name as branch_name
        FROM reservations r
        JOIN vehicles v ON r.vehicle_id = v.vehicle_id
        JOIN branches b ON v.branch_id = b.branch_id
        WHERE r.customer_id = $1
        ORDER BY r.created_at DESC
        LIMIT 5
      `, [customerId])
    ]);

    res.json({
      success: true,
      data: {
        totals: {
          reservations: parseInt(totalReservationsResult.rows[0].count),
          upcomingReservations: parseInt(upcomingReservationsResult.rows[0].count),
          completedReservations: parseInt(completedReservationsResult.rows[0].count),
          totalSpent: parseFloat(totalSpentResult.rows[0].total)
        },
        recentReservations: recentReservationsResult.rows.map(row => ({
          ...row,
          total_cost: parseFloat(row.total_cost)
        }))
      }
    });

  } catch (error) {
    next(error);
  }
});

// Get revenue analytics (Admin only)
router.get('/admin/revenue', [authenticateToken, requireAdmin], async (req, res, next) => {
  try {
    const { period = 'month' } = req.query;
    
    let dateFormat, dateInterval;
    switch (period) {
      case 'week':
        dateFormat = 'week';
        dateInterval = '12 weeks';
        break;
      case 'year':
        dateFormat = 'year';
        dateInterval = '5 years';
        break;
      default:
        dateFormat = 'month';
        dateInterval = '12 months';
    }

    const result = await db.query(`
      SELECT 
        DATE_TRUNC($1, p.payment_date) as period,
        COUNT(p.payment_id) as transaction_count,
        SUM(p.amount) as total_revenue,
        AVG(p.amount) as avg_transaction
      FROM payments p
      WHERE p.status = 'completed' 
        AND p.payment_date >= CURRENT_DATE - INTERVAL '${dateInterval}'
      GROUP BY DATE_TRUNC($1, p.payment_date)
      ORDER BY period ASC
    `, [dateFormat]);

    res.json({
      success: true,
      period: period,
      data: result.rows.map(row => ({
        period: row.period,
        transaction_count: parseInt(row.transaction_count),
        total_revenue: parseFloat(row.total_revenue),
        avg_transaction: parseFloat(row.avg_transaction)
      }))
    });

  } catch (error) {
    next(error);
  }
});

// Get vehicle performance analytics (Admin only)
router.get('/admin/vehicle-performance', [authenticateToken, requireAdmin], async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT 
        v.vehicle_id,
        v.make,
        v.model,
        v.year,
        v.daily_rate,
        COUNT(r.reservation_id) as total_bookings,
        SUM(CASE WHEN r.status = 'completed' THEN r.total_cost ELSE 0 END) as total_revenue,
        AVG(CASE WHEN r.status = 'completed' THEN r.total_cost ELSE NULL END) as avg_booking_value,
        MIN(r.start_date) as first_booking,
        MAX(r.end_date) as last_booking,
        ROUND(
          COUNT(r.reservation_id)::DECIMAL / 
          GREATEST(DATE_PART('day', CURRENT_DATE - v.created_at), 1) * 100, 
          2
        ) as utilization_rate
      FROM vehicles v
      LEFT JOIN reservations r ON v.vehicle_id = r.vehicle_id
      GROUP BY v.vehicle_id, v.make, v.model, v.year, v.daily_rate, v.created_at
      ORDER BY total_revenue DESC
    `);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        ...row,
        total_bookings: parseInt(row.total_bookings),
        total_revenue: parseFloat(row.total_revenue || 0),
        avg_booking_value: parseFloat(row.avg_booking_value || 0),
        daily_rate: parseFloat(row.daily_rate),
        utilization_rate: parseFloat(row.utilization_rate || 0)
      }))
    });

  } catch (error) {
    next(error);
  }
});

// Get branch performance analytics (Admin only)
router.get('/admin/branch-performance', [authenticateToken, requireAdmin], async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT 
        b.branch_id,
        b.name,
        b.location,
        COUNT(v.vehicle_id) as total_vehicles,
        COUNT(r.reservation_id) as total_reservations,
        SUM(CASE WHEN r.status = 'completed' THEN r.total_cost ELSE 0 END) as total_revenue,
        AVG(CASE WHEN r.status = 'completed' THEN r.total_cost ELSE NULL END) as avg_reservation_value
      FROM branches b
      LEFT JOIN vehicles v ON b.branch_id = v.branch_id
      LEFT JOIN reservations r ON v.vehicle_id = r.vehicle_id
      GROUP BY b.branch_id, b.name, b.location
      ORDER BY total_revenue DESC
    `);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        ...row,
        total_vehicles: parseInt(row.total_vehicles),
        total_reservations: parseInt(row.total_reservations),
        total_revenue: parseFloat(row.total_revenue || 0),
        avg_reservation_value: parseFloat(row.avg_reservation_value || 0)
      }))
    });

  } catch (error) {
    next(error);
  }
});

// Additional endpoints that frontend expects
router.get('/sales-by-branch', [authenticateToken, requireAdmin], async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT 
        b.name as branch_name,
        COUNT(r.reservation_id) as reservation_count,
        COALESCE(SUM(p.amount), 0) as total_sales
      FROM branches b
      LEFT JOIN vehicles v ON b.branch_id = v.branch_id
      LEFT JOIN reservations r ON v.vehicle_id = r.vehicle_id
      LEFT JOIN payments p ON r.reservation_id = p.reservation_id AND p.status = 'completed'
      GROUP BY b.branch_id, b.name
      ORDER BY total_sales DESC
    `);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        ...row,
        total_sales: parseFloat(row.total_sales || 0),
        reservation_count: parseInt(row.reservation_count || 0)
      }))
    });
  } catch (error) {
    next(error);
  }
});

router.get('/reservations-trend', [authenticateToken, requireAdmin], async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as reservations
      FROM reservations
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 7
    `);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        date: row.date,
        reservations: parseInt(row.reservations || 0)
      })).reverse()
    });
  } catch (error) {
    next(error);
  }
});

router.get('/fleet-stats', [authenticateToken, requireAdmin], async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT 
        COUNT(CASE WHEN status = 'available' THEN 1 END) as available,
        COUNT(CASE WHEN status = 'rented' THEN 1 END) as rented,
        COUNT(CASE WHEN status = 'maintenance' THEN 1 END) as maintenance,
        COUNT(*) as total_vehicles
      FROM vehicles
    `);

    const row = result.rows[0];
    res.json({
      success: true,
      data: {
        available: parseInt(row.available || 0),
        rented: parseInt(row.rented || 0),
        maintenance: parseInt(row.maintenance || 0),
        total_vehicles: parseInt(row.total_vehicles || 0)
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;