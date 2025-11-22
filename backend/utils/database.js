const { Pool } = require('pg');
require('dotenv').config();

// PostgreSQL connection configuration
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'car_rental_db',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
  max: 10, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test the connection
pool.on('connect', () => {
  console.log('🗄️  Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// Initialize database schema and seed data
async function initializeDatabase() {
  try {
    // Check if tables exist
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'customers'
      );
    `);
    
    if (!result.rows[0].exists) {
      console.log('🏗️  Creating database schema...');
      await createSchema();
      await seedInitialData();
    } else {
      console.log('✅ Database schema already exists');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

async function createSchema() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create tables
    await client.query(`
      -- Create customers table
      CREATE TABLE customers (
          customer_id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          phone VARCHAR(20),
          address TEXT,
          date_of_birth DATE,
          driver_license VARCHAR(50) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      -- Create branches table
      CREATE TABLE branches (
          branch_id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          location VARCHAR(200) NOT NULL,
          phone VARCHAR(20),
          email VARCHAR(100),
          address TEXT,
          manager_name VARCHAR(100),
          opening_hours VARCHAR(100) DEFAULT '9:00 AM - 6:00 PM',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      -- Create vehicles table
      CREATE TABLE vehicles (
          vehicle_id SERIAL PRIMARY KEY,
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
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      -- Create reservations table
      CREATE TABLE reservations (
          reservation_id SERIAL PRIMARY KEY,
          customer_id INTEGER NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
          vehicle_id INTEGER NOT NULL REFERENCES vehicles(vehicle_id) ON DELETE RESTRICT,
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,
          total_cost DECIMAL(10, 2) NOT NULL CHECK (total_cost >= 0),
          status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled')),
          pickup_location VARCHAR(200),
          dropoff_location VARCHAR(200),
          special_requests TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT valid_date_range CHECK (end_date > start_date)
      );
    `);

    await client.query(`
      -- Create payments table
      CREATE TABLE payments (
          payment_id SERIAL PRIMARY KEY,
          reservation_id INTEGER NOT NULL REFERENCES reservations(reservation_id) ON DELETE CASCADE,
          amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
          payment_date TIMESTAMP NOT NULL,
          payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('card', 'debit', 'cash', 'bank_transfer')),
          status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
          txn_ref VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(reservation_id)
      );
    `);

    // Create indexes
    await client.query(`
      CREATE INDEX idx_customers_email ON customers(email);
      CREATE INDEX idx_vehicles_branch ON vehicles(branch_id);
      CREATE INDEX idx_vehicles_status ON vehicles(status);
      CREATE INDEX idx_reservations_customer ON reservations(customer_id);
      CREATE INDEX idx_reservations_vehicle ON reservations(vehicle_id);
      CREATE INDEX idx_reservations_dates ON reservations(start_date, end_date);
      CREATE INDEX idx_reservations_status ON reservations(status);
      CREATE INDEX idx_payments_reservation ON payments(reservation_id);
      CREATE INDEX idx_payments_status ON payments(status);
      CREATE INDEX idx_payments_date ON payments(payment_date);
    `);

    await client.query('COMMIT');
    console.log('✅ Database schema created successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function seedInitialData() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    console.log('🌱 Seeding initial data...');

    // Insert branches
    await client.query(`
      INSERT INTO branches (name, location, phone, email, address, manager_name) VALUES 
      ('Downtown Branch', 'New York, NY', '+1-555-0101', 'downtown@carrental.com', '123 Main St, New York, NY 10001', 'John Smith'),
      ('Airport Branch', 'Los Angeles, CA', '+1-555-0102', 'airport@carrental.com', '456 Airport Blvd, Los Angeles, CA 90045', 'Sarah Johnson'),
      ('Central Branch', 'Chicago, IL', '+1-555-0103', 'central@carrental.com', '789 Central Ave, Chicago, IL 60601', 'Mike Brown'),
      ('Midtown Branch', 'Houston, TX', '+1-555-0104', 'midtown@carrental.com', '321 Midtown Dr, Houston, TX 77002', 'Lisa Davis'),
      ('Harbor Branch', 'Seattle, WA', '+1-555-0105', 'harbor@carrental.com', '654 Harbor St, Seattle, WA 98101', 'David Wilson')
    `);

    // Insert customers (password hash for 'password123')
    const passwordHash = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'; // bcrypt hash for 'password123'
    await client.query(`
      INSERT INTO customers (name, email, phone, address, date_of_birth, driver_license, password_hash, role) VALUES 
      ('Admin User', 'admin@carrental.com', '+1-555-1001', '100 Admin St, New York, NY', '1985-01-15', 'ADM123456789', $1, 'admin'),
      ('Alice Cooper', 'alice.cooper@email.com', '+1-555-1002', '200 Oak Ave, Los Angeles, CA', '1990-05-20', 'DL1234567890', $1, 'customer'),
      ('Bob Johnson', 'bob.johnson@email.com', '+1-555-1003', '300 Pine St, Chicago, IL', '1988-08-10', 'DL2345678901', $1, 'customer'),
      ('Carol Smith', 'carol.smith@email.com', '+1-555-1004', '400 Elm Dr, Houston, TX', '1995-03-25', 'DL3456789012', $1, 'customer'),
      ('David Brown', 'david.brown@email.com', '+1-555-1005', '500 Maple Ln, Seattle, WA', '1987-11-12', 'DL4567890123', $1, 'customer')
    `, [passwordHash]);

    // Insert vehicles
    await client.query(`
      INSERT INTO vehicles (make, model, year, color, license_plate, vin, fuel_type, transmission, seats, daily_rate, branch_id, mileage) VALUES 
      ('Toyota', 'Camry', 2023, 'White', 'NY-CAM-001', '1HGBH41JXMN109186', 'petrol', 'automatic', 5, 45.00, 1, 15000),
      ('Honda', 'Civic', 2022, 'Blue', 'NY-CIV-002', '2HGFB2F5XEH123456', 'petrol', 'manual', 5, 40.00, 1, 22000),
      ('Ford', 'Escape', 2023, 'Black', 'NY-ESC-003', '1FMCU0HD9EUB12345', 'petrol', 'automatic', 5, 50.00, 1, 18000),
      ('Tesla', 'Model 3', 2023, 'Red', 'NY-TES-004', '5YJ3E1EA3EF123456', 'electric', 'automatic', 5, 75.00, 1, 8000),
      ('Chevrolet', 'Suburban', 2023, 'Silver', 'CA-SUB-001', '1GNSKJKC9ER123456', 'petrol', 'automatic', 8, 85.00, 2, 12000),
      ('Nissan', 'Altima', 2022, 'Gray', 'CA-ALT-002', '1N4AL3AP8EC123456', 'petrol', 'automatic', 5, 42.00, 2, 25000),
      ('BMW', 'X3', 2023, 'White', 'CA-BMW-003', 'WBXPT7C50EP123456', 'petrol', 'automatic', 5, 95.00, 2, 10000),
      ('Jeep', 'Wrangler', 2022, 'Green', 'CA-JEP-004', '1C4HJWEG9EL123456', 'petrol', 'manual', 5, 65.00, 2, 20000),
      ('Mercedes', 'C-Class', 2023, 'Black', 'IL-MER-001', 'WDDGF4HB1EN123456', 'petrol', 'automatic', 5, 90.00, 3, 8500),
      ('Hyundai', 'Elantra', 2022, 'Silver', 'IL-ELA-002', 'KMHL14JA6EA123456', 'petrol', 'automatic', 5, 38.00, 3, 28000),
      ('Audi', 'Q5', 2023, 'Blue', 'IL-AUD-003', 'WA1ANAFY9E2123456', 'petrol', 'automatic', 5, 100.00, 3, 9000),
      ('Ford', 'F-150', 2023, 'White', 'TX-FOR-001', '1FTFW1ET9EFC12345', 'petrol', 'automatic', 6, 70.00, 4, 14000),
      ('Mazda', 'CX-5', 2022, 'Red', 'TX-MAZ-002', 'JM3KFBCL1E0123456', 'petrol', 'automatic', 5, 48.00, 4, 19000),
      ('Lexus', 'ES', 2023, 'Silver', 'TX-LEX-003', '58ABK1GG5EU123456', 'hybrid', 'automatic', 5, 80.00, 4, 7000),
      ('Volvo', 'XC90', 2023, 'Blue', 'WA-VOL-001', 'YV4A22PL4E1123456', 'hybrid', 'automatic', 7, 110.00, 5, 6000),
      ('Kia', 'Optima', 2022, 'White', 'WA-KIA-002', 'KNAGM4A78E5123456', 'petrol', 'automatic', 5, 41.00, 5, 26000)
    `);

    // Insert sample reservations
    await client.query(`
      INSERT INTO reservations (customer_id, vehicle_id, start_date, end_date, total_cost, status, pickup_location, dropoff_location) VALUES 
      (2, 1, '2024-01-15', '2024-01-20', 225.00, 'completed', 'Downtown Branch', 'Downtown Branch'),
      (3, 6, '2024-01-10', '2024-01-12', 84.00, 'completed', 'Airport Branch', 'Airport Branch'),
      (4, 10, '2024-01-05', '2024-01-08', 114.00, 'completed', 'Central Branch', 'Central Branch'),
      (2, 2, '2024-02-01', '2024-02-05', 160.00, 'active', 'Downtown Branch', 'Downtown Branch'),
      (5, 8, '2024-02-02', '2024-02-04', 130.00, 'active', 'Airport Branch', 'Airport Branch')
    `);

    // Insert sample payments
    await client.query(`
      INSERT INTO payments (reservation_id, amount, payment_date, payment_method, status, txn_ref) VALUES 
      (1, 225.00, '2024-01-15 10:30:00', 'card', 'completed', 'TXN_1705328200_1'),
      (2, 84.00, '2024-01-10 14:15:00', 'card', 'completed', 'TXN_1704895700_2'),
      (3, 114.00, '2024-01-05 09:45:00', 'debit', 'completed', 'TXN_1704463500_3'),
      (4, 160.00, '2024-02-01 11:20:00', 'card', 'completed', 'TXN_1706784000_4'),
      (5, 130.00, '2024-02-02 16:30:00', 'bank_transfer', 'completed', 'TXN_1706874600_5')
    `);

    await client.query('COMMIT');
    
    console.log('✅ Initial data seeded successfully!');
    console.log('🔑 Test accounts:');
    console.log('   Admin: admin@carrental.com / password123');
    console.log('   Customer: alice.cooper@email.com / password123');
    console.log('   Customer: bob.johnson@email.com / password123');
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Initialize database on startup
initializeDatabase();

// Export pool methods
module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
  pool: pool,
  close: () => pool.end()
};