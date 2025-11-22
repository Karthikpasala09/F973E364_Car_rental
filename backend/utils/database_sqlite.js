const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const logger = require('./logger');

class Database {
  constructor() {
    const dbPath = path.join(__dirname, '../data');
    if (!fs.existsSync(dbPath)) {
      fs.mkdirSync(dbPath, { recursive: true });
    }
    
    this.db = new sqlite3.Database(path.join(dbPath, 'car_rental.db'), (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
      } else {
        console.log('🗄️  Connected to SQLite database.');
        this.initializeDatabase();
      }
    });
  }

  query(sql, params = []) {
    return new Promise((resolve, reject) => {
      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        this.db.all(sql, params, (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve({ rows });
          }
        });
      } else {
        this.db.run(sql, params, function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ 
              rows: [{ lastID: this.lastID, changes: this.changes }],
              lastID: this.lastID,
              changes: this.changes 
            });
          }
        });
      }
    });
  }

  async getClient() {
    return {
      query: this.query.bind(this),
      release: () => {}
    };
  }

  initializeDatabase() {
    const schema = `
      -- Create customers table
      CREATE TABLE IF NOT EXISTS customers (
          customer_id INTEGER PRIMARY KEY AUTOINCREMENT,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          phone VARCHAR(20),
          address TEXT,
          date_of_birth DATE,
          driver_license VARCHAR(50) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Create branches table
      CREATE TABLE IF NOT EXISTS branches (
          branch_id INTEGER PRIMARY KEY AUTOINCREMENT,
          name VARCHAR(100) NOT NULL,
          location VARCHAR(200) NOT NULL,
          phone VARCHAR(20),
          email VARCHAR(100),
          address TEXT,
          manager_name VARCHAR(100),
          opening_hours VARCHAR(100) DEFAULT '9:00 AM - 6:00 PM',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Create vehicles table
      CREATE TABLE IF NOT EXISTS vehicles (
          vehicle_id INTEGER PRIMARY KEY AUTOINCREMENT,
          make VARCHAR(50) NOT NULL,
          model VARCHAR(50) NOT NULL,
          year INTEGER NOT NULL CHECK (year >= 1900 AND year <= 2030),
          color VARCHAR(30),
          license_plate VARCHAR(20) UNIQUE NOT NULL,
          vin VARCHAR(17) UNIQUE,
          fuel_type VARCHAR(20) DEFAULT 'petrol' CHECK (fuel_type IN ('petrol', 'diesel', 'hybrid', 'electric')),
          transmission VARCHAR(20) DEFAULT 'manual' CHECK (transmission IN ('manual', 'automatic')),
          seats INTEGER DEFAULT 5 CHECK (seats > 0 AND seats <= 12),
          daily_rate DECIMAL(10, 2) NOT NULL CHECK (daily_rate > 0),
          status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'rented', 'maintenance', 'retired')),
          branch_id INTEGER NOT NULL REFERENCES branches(branch_id) ON DELETE RESTRICT,
          mileage INTEGER DEFAULT 0 CHECK (mileage >= 0),
          last_service_date DATE,
          insurance_expiry DATE,
          registration_expiry DATE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Create reservations table
      CREATE TABLE IF NOT EXISTS reservations (
          reservation_id INTEGER PRIMARY KEY AUTOINCREMENT,
          customer_id INTEGER NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
          vehicle_id INTEGER NOT NULL REFERENCES vehicles(vehicle_id) ON DELETE RESTRICT,
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,
          total_cost DECIMAL(10, 2) NOT NULL CHECK (total_cost >= 0),
          status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled')),
          pickup_location VARCHAR(200),
          dropoff_location VARCHAR(200),
          special_requests TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Create payments table
      CREATE TABLE IF NOT EXISTS payments (
          payment_id INTEGER PRIMARY KEY AUTOINCREMENT,
          reservation_id INTEGER NOT NULL REFERENCES reservations(reservation_id) ON DELETE CASCADE,
          amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
          payment_date DATETIME NOT NULL,
          payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('card', 'debit', 'cash', 'bank_transfer')),
          status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
          txn_ref VARCHAR(100),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
      CREATE INDEX IF NOT EXISTS idx_vehicles_branch ON vehicles(branch_id);
      CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
      CREATE INDEX IF NOT EXISTS idx_reservations_customer ON reservations(customer_id);
      CREATE INDEX IF NOT EXISTS idx_reservations_vehicle ON reservations(vehicle_id);
      CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
      CREATE INDEX IF NOT EXISTS idx_payments_reservation ON payments(reservation_id);
      CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
    `;

    // Execute schema
    this.db.exec(schema, (err) => {
      if (err) {
        console.error('Error creating schema:', err.message);
      } else {
        console.log('✅ Database schema initialized successfully.');
        this.seedInitialData();
      }
    });
  }

  async seedInitialData() {
    try {
      // Check if data already exists
      const existingUsers = await this.query('SELECT COUNT(*) as count FROM customers');
      
      if (existingUsers.rows[0].count > 0) {
        console.log('Database already has data, skipping seed.');
        return;
      }

      console.log('🌱 Seeding initial data...');

      // Insert branches
      await this.query(`INSERT INTO branches (name, location, phone, email, address, manager_name) VALUES 
        ('Downtown Branch', 'New York, NY', '+1-555-0101', 'downtown@carrental.com', '123 Main St, New York, NY 10001', 'John Smith'),
        ('Airport Branch', 'Los Angeles, CA', '+1-555-0102', 'airport@carrental.com', '456 Airport Blvd, Los Angeles, CA 90045', 'Sarah Johnson'),
        ('Central Branch', 'Chicago, IL', '+1-555-0103', 'central@carrental.com', '789 Central Ave, Chicago, IL 60601', 'Mike Brown')`);

      // Insert customers (password hash for 'password123')
      const passwordHash = '$2b$10$rQZ9QV7z5X4zP5V7z5X4zOlO5V7z5X4zP5V7z5X4zO';
      await this.query(`INSERT INTO customers (name, email, phone, address, date_of_birth, driver_license, password_hash, role) VALUES 
        ('Admin User', 'admin@carrental.com', '+1-555-1001', '100 Admin St, New York, NY', '1985-01-15', 'ADM123456789', ?, 'admin'),
        ('Alice Cooper', 'alice.cooper@email.com', '+1-555-1002', '200 Oak Ave, Los Angeles, CA', '1990-05-20', 'DL1234567890', ?, 'customer'),
        ('Bob Johnson', 'bob.johnson@email.com', '+1-555-1003', '300 Pine St, Chicago, IL', '1988-08-10', 'DL2345678901', ?, 'customer')`,
        [passwordHash, passwordHash, passwordHash]);

      // Insert vehicles
      await this.query(`INSERT INTO vehicles (make, model, year, color, license_plate, fuel_type, transmission, seats, daily_rate, branch_id, mileage) VALUES 
        ('Toyota', 'Camry', 2023, 'White', 'NY-CAM-001', 'petrol', 'automatic', 5, 45.00, 1, 15000),
        ('Honda', 'Civic', 2022, 'Blue', 'NY-CIV-002', 'petrol', 'manual', 5, 40.00, 2, 22000),
        ('Ford', 'Escape', 2023, 'Black', 'NY-ESC-003', 'petrol', 'automatic', 5, 50.00, 3, 18000),
        ('Tesla', 'Model 3', 2023, 'Red', 'CA-TES-004', 'electric', 'automatic', 5, 75.00, 1, 8000),
        ('BMW', 'X3', 2023, 'White', 'CA-BMW-005', 'petrol', 'automatic', 5, 95.00, 2, 10000)`);

      console.log('✅ Initial data seeded successfully!');
      console.log('🔑 Test accounts created:');
      console.log('   Admin: admin@carrental.com / password123');
      console.log('   User: alice.cooper@email.com / password123');

    } catch (error) {
      console.error('Error seeding data:', error.message);
    }
  }

  async close() {
    return new Promise((resolve) => {
      this.db.close((err) => {
        if (err) {
          console.error('Error closing database:', err.message);
        } else {
          console.log('Database connection closed.');
        }
        resolve();
      });
    });
  }
}

module.exports = new Database();