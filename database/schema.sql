-- Car Rental Application Database Schema
-- PostgreSQL Database Setup Script

-- Create database (run this separately if needed)
-- CREATE DATABASE car_rental_db;

-- Connect to the database
-- \c car_rental_db;

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop tables if they exist (be careful with this in production)
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS branches CASCADE;
DROP TABLE IF EXISTS customers CASCADE;

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

-- Create vehicles table
CREATE TABLE vehicles (
    vehicle_id SERIAL PRIMARY KEY,
    make VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    year INTEGER NOT NULL CHECK (year >= 1900 AND year <= EXTRACT(YEAR FROM CURRENT_DATE) + 1),
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
    UNIQUE(reservation_id) -- One payment per reservation
);

-- Create indexes for better performance
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

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON branches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a view for available vehicles
CREATE VIEW available_vehicles AS
SELECT 
    v.*,
    b.name as branch_name,
    b.location as branch_location
FROM vehicles v
JOIN branches b ON v.branch_id = b.branch_id
WHERE v.status = 'available';

-- Create a view for reservation summary
CREATE VIEW reservation_summary AS
SELECT 
    r.reservation_id,
    r.start_date,
    r.end_date,
    r.total_cost,
    r.status,
    c.name as customer_name,
    c.email as customer_email,
    c.phone as customer_phone,
    v.make as vehicle_make,
    v.model as vehicle_model,
    v.year as vehicle_year,
    v.license_plate,
    b.name as branch_name,
    b.location as branch_location,
    p.amount as payment_amount,
    p.status as payment_status
FROM reservations r
JOIN customers c ON r.customer_id = c.customer_id
JOIN vehicles v ON r.vehicle_id = v.vehicle_id
JOIN branches b ON v.branch_id = b.branch_id
LEFT JOIN payments p ON r.reservation_id = p.reservation_id;

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO car_rental_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO car_rental_user;

COMMENT ON DATABASE car_rental_db IS 'Car Rental Management System Database';
COMMENT ON TABLE customers IS 'Customer information and authentication data';
COMMENT ON TABLE branches IS 'Car rental branch locations';
COMMENT ON TABLE vehicles IS 'Vehicle inventory across all branches';
COMMENT ON TABLE reservations IS 'Customer vehicle reservations';
COMMENT ON TABLE payments IS 'Payment records for reservations';

COMMENT ON COLUMN customers.role IS 'User role: customer or admin';
COMMENT ON COLUMN vehicles.status IS 'Vehicle status: available, rented, maintenance, retired';
COMMENT ON COLUMN reservations.status IS 'Reservation status: pending, confirmed, active, completed, cancelled';
COMMENT ON COLUMN payments.status IS 'Payment status: pending, completed, failed, refunded';