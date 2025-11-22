-- Car Rental Application Seed Data
-- Sample data for testing and development

-- Insert sample branches
INSERT INTO branches (name, location, phone, email, address, manager_name) VALUES
('Downtown Branch', 'New York, NY', '+1-555-0101', 'downtown@carrental.com', '123 Main St, New York, NY 10001', 'John Smith'),
('Airport Branch', 'Los Angeles, CA', '+1-555-0102', 'airport@carrental.com', '456 Airport Blvd, Los Angeles, CA 90045', 'Sarah Johnson'),
('Central Branch', 'Chicago, IL', '+1-555-0103', 'central@carrental.com', '789 Central Ave, Chicago, IL 60601', 'Mike Brown'),
('Midtown Branch', 'Houston, TX', '+1-555-0104', 'midtown@carrental.com', '321 Midtown Dr, Houston, TX 77002', 'Lisa Davis'),
('Harbor Branch', 'Seattle, WA', '+1-555-0105', 'harbor@carrental.com', '654 Harbor St, Seattle, WA 98101', 'David Wilson');

-- Insert sample customers (passwords are hashed version of 'password123')
INSERT INTO customers (name, email, phone, address, date_of_birth, driver_license, password_hash, role) VALUES
('Admin User', 'admin@carrental.com', '+1-555-1001', '100 Admin St, New York, NY', '1985-01-15', 'ADM123456789', '$2b$10$example.hash.for.password123', 'admin'),
('Alice Cooper', 'alice.cooper@email.com', '+1-555-1002', '200 Oak Ave, Los Angeles, CA', '1990-05-20', 'DL1234567890', '$2b$10$example.hash.for.password123', 'customer'),
('Bob Johnson', 'bob.johnson@email.com', '+1-555-1003', '300 Pine St, Chicago, IL', '1988-08-10', 'DL2345678901', '$2b$10$example.hash.for.password123', 'customer'),
('Carol Smith', 'carol.smith@email.com', '+1-555-1004', '400 Elm Dr, Houston, TX', '1995-03-25', 'DL3456789012', '$2b$10$example.hash.for.password123', 'customer'),
('David Brown', 'david.brown@email.com', '+1-555-1005', '500 Maple Ln, Seattle, WA', '1987-11-12', 'DL4567890123', '$2b$10$example.hash.for.password123', 'customer'),
('Emma Wilson', 'emma.wilson@email.com', '+1-555-1006', '600 Cedar Ave, New York, NY', '1992-07-08', 'DL5678901234', '$2b$10$example.hash.for.password123', 'customer');

-- Insert sample vehicles
INSERT INTO vehicles (make, model, year, color, license_plate, vin, fuel_type, transmission, seats, daily_rate, branch_id, mileage) VALUES
-- Downtown Branch vehicles
('Toyota', 'Camry', 2023, 'White', 'NY-CAM-001', '1HGBH41JXMN109186', 'petrol', 'automatic', 5, 45.00, 1, 15000),
('Honda', 'Civic', 2022, 'Blue', 'NY-CIV-002', '2HGFB2F5XEH123456', 'petrol', 'manual', 5, 40.00, 1, 22000),
('Ford', 'Escape', 2023, 'Black', 'NY-ESC-003', '1FMCU0HD9EUB12345', 'petrol', 'automatic', 5, 50.00, 1, 18000),
('Tesla', 'Model 3', 2023, 'Red', 'NY-TES-004', '5YJ3E1EA3EF123456', 'electric', 'automatic', 5, 75.00, 1, 8000),

-- Airport Branch vehicles
('Chevrolet', 'Suburban', 2023, 'Silver', 'CA-SUB-001', '1GNSKJKC9ER123456', 'petrol', 'automatic', 8, 85.00, 2, 12000),
('Nissan', 'Altima', 2022, 'Gray', 'CA-ALT-002', '1N4AL3AP8EC123456', 'petrol', 'automatic', 5, 42.00, 2, 25000),
('BMW', 'X3', 2023, 'White', 'CA-BMW-003', 'WBXPT7C50EP123456', 'petrol', 'automatic', 5, 95.00, 2, 10000),
('Jeep', 'Wrangler', 2022, 'Green', 'CA-JEP-004', '1C4HJWEG9EL123456', 'petrol', 'manual', 5, 65.00, 2, 20000),

-- Central Branch vehicles
('Mercedes', 'C-Class', 2023, 'Black', 'IL-MER-001', 'WDDGF4HB1EN123456', 'petrol', 'automatic', 5, 90.00, 3, 8500),
('Hyundai', 'Elantra', 2022, 'Silver', 'IL-ELA-002', 'KMHL14JA6EA123456', 'petrol', 'automatic', 5, 38.00, 3, 28000),
('Audi', 'Q5', 2023, 'Blue', 'IL-AUD-003', 'WA1ANAFY9E2123456', 'petrol', 'automatic', 5, 100.00, 3, 9000),
('Subaru', 'Outback', 2022, 'Green', 'IL-SUB-004', '4S4BSANC1E3123456', 'petrol', 'automatic', 5, 55.00, 3, 21000),

-- Midtown Branch vehicles
('Ford', 'F-150', 2023, 'White', 'TX-FOR-001', '1FTFW1ET9EFC12345', 'petrol', 'automatic', 6, 70.00, 4, 14000),
('Mazda', 'CX-5', 2022, 'Red', 'TX-MAZ-002', 'JM3KFBCL1E0123456', 'petrol', 'automatic', 5, 48.00, 4, 19000),
('Lexus', 'ES', 2023, 'Silver', 'TX-LEX-003', '58ABK1GG5EU123456', 'hybrid', 'automatic', 5, 80.00, 4, 7000),
('Volkswagen', 'Jetta', 2022, 'Black', 'TX-VW-004', '3VWC57BU9EM123456', 'petrol', 'automatic', 5, 43.00, 4, 23000),

-- Harbor Branch vehicles
('Volvo', 'XC90', 2023, 'Blue', 'WA-VOL-001', 'YV4A22PL4E1123456', 'hybrid', 'automatic', 7, 110.00, 5, 6000),
('Kia', 'Optima', 2022, 'White', 'WA-KIA-002', 'KNAGM4A78E5123456', 'petrol', 'automatic', 5, 41.00, 5, 26000),
('Cadillac', 'Escalade', 2023, 'Black', 'WA-CAD-003', '1GYS4CKJ9ER123456', 'petrol', 'automatic', 8, 120.00, 5, 5000),
('Acura', 'TLX', 2022, 'Gray', 'WA-ACU-004', '19UUB2F55EA123456', 'petrol', 'automatic', 5, 60.00, 5, 17000);

-- Set some vehicles to different statuses for testing
UPDATE vehicles SET status = 'rented' WHERE vehicle_id IN (2, 5, 8, 11);
UPDATE vehicles SET status = 'maintenance' WHERE vehicle_id IN (4, 9);

-- Insert sample reservations
INSERT INTO reservations (customer_id, vehicle_id, start_date, end_date, total_cost, status, pickup_location, dropoff_location) VALUES
-- Completed reservations
(2, 1, '2024-01-15', '2024-01-20', 225.00, 'completed', 'Downtown Branch', 'Downtown Branch'),
(3, 6, '2024-01-10', '2024-01-12', 84.00, 'completed', 'Airport Branch', 'Airport Branch'),
(4, 10, '2024-01-05', '2024-01-08', 114.00, 'completed', 'Central Branch', 'Central Branch'),

-- Active reservations
(2, 2, '2024-02-01', '2024-02-05', 160.00, 'active', 'Downtown Branch', 'Downtown Branch'),
(5, 8, '2024-02-02', '2024-02-04', 130.00, 'active', 'Airport Branch', 'Airport Branch'),
(6, 11, '2024-02-01', '2024-02-03', 76.00, 'active', 'Central Branch', 'Central Branch'),

-- Confirmed future reservations
(3, 14, '2024-03-15', '2024-03-18', 144.00, 'confirmed', 'Midtown Branch', 'Midtown Branch'),
(4, 17, '2024-03-20', '2024-03-25', 550.00, 'confirmed', 'Harbor Branch', 'Harbor Branch'),

-- Pending reservations
(5, 12, '2024-04-10', '2024-04-15', 275.00, 'pending', 'Central Branch', 'Central Branch'),
(6, 16, '2024-04-12', '2024-04-14', 86.00, 'pending', 'Midtown Branch', 'Midtown Branch');

-- Insert sample payments for completed and active reservations
INSERT INTO payments (reservation_id, amount, payment_date, payment_method, status, txn_ref) VALUES
-- Payments for completed reservations
(1, 225.00, '2024-01-15 10:30:00', 'card', 'completed', 'TXN_1705328200_1'),
(2, 84.00, '2024-01-10 14:15:00', 'card', 'completed', 'TXN_1704895700_2'),
(3, 114.00, '2024-01-05 09:45:00', 'debit', 'completed', 'TXN_1704463500_3'),

-- Payments for active reservations
(4, 160.00, '2024-02-01 11:20:00', 'card', 'completed', 'TXN_1706784000_4'),
(5, 130.00, '2024-02-02 16:30:00', 'bank_transfer', 'completed', 'TXN_1706874600_5'),
(6, 76.00, '2024-02-01 13:10:00', 'debit', 'completed', 'TXN_1706787000_6'),

-- Payments for confirmed reservations
(7, 144.00, '2024-02-20 10:00:00', 'card', 'completed', 'TXN_1708423200_7'),
(8, 550.00, '2024-02-22 15:45:00', 'card', 'completed', 'TXN_1708613100_8');

-- Update service dates for some vehicles
UPDATE vehicles SET last_service_date = '2024-01-01' WHERE vehicle_id <= 10;
UPDATE vehicles SET last_service_date = '2023-12-15' WHERE vehicle_id > 10;

-- Update insurance and registration expiry dates
UPDATE vehicles SET 
    insurance_expiry = CURRENT_DATE + INTERVAL '1 year',
    registration_expiry = CURRENT_DATE + INTERVAL '2 years';

-- Create some historical data for analytics (previous months)
INSERT INTO reservations (customer_id, vehicle_id, start_date, end_date, total_cost, status, pickup_location, dropoff_location, created_at) VALUES
(2, 3, '2023-12-01', '2023-12-05', 200.00, 'completed', 'Downtown Branch', 'Downtown Branch', '2023-12-01 10:00:00'),
(3, 7, '2023-12-10', '2023-12-13', 285.00, 'completed', 'Airport Branch', 'Airport Branch', '2023-12-10 11:00:00'),
(4, 15, '2023-11-15', '2023-11-18', 240.00, 'completed', 'Midtown Branch', 'Midtown Branch', '2023-11-15 12:00:00'),
(5, 19, '2023-11-20', '2023-11-22', 82.00, 'completed', 'Harbor Branch', 'Harbor Branch', '2023-11-20 13:00:00');

-- Add corresponding historical payments
INSERT INTO payments (reservation_id, amount, payment_date, payment_method, status, txn_ref) VALUES
(11, 200.00, '2023-12-01 10:30:00', 'card', 'completed', 'TXN_1701424200_11'),
(12, 285.00, '2023-12-10 11:30:00', 'debit', 'completed', 'TXN_1702202200_12'),
(13, 240.00, '2023-11-15 12:30:00', 'card', 'completed', 'TXN_1700050200_13'),
(14, 82.00, '2023-11-20 13:30:00', 'cash', 'completed', 'TXN_1700482200_14');

-- Add some comments for reference
COMMENT ON TABLE branches IS 'Contains 5 sample branches across different cities';
COMMENT ON TABLE customers IS 'Contains 1 admin user and 5 test customers (password: password123)';
COMMENT ON TABLE vehicles IS 'Contains 20 vehicles with various makes, models, and statuses';
COMMENT ON TABLE reservations IS 'Contains sample reservations in different statuses';
COMMENT ON TABLE payments IS 'Contains payment records for testing payment flows';

-- Display summary of inserted data
SELECT 'Branches' as table_name, COUNT(*) as record_count FROM branches
UNION ALL
SELECT 'Customers', COUNT(*) FROM customers
UNION ALL
SELECT 'Vehicles', COUNT(*) FROM vehicles
UNION ALL
SELECT 'Reservations', COUNT(*) FROM reservations
UNION ALL
SELECT 'Payments', COUNT(*) FROM payments
ORDER BY table_name;