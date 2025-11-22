# Backend API Structure Reference

For the frontend to work properly, you'll need a Node.js + Express backend with the following structure:

## Required Dependencies
```json
{
  "express": "^4.18.0",
  "cors": "^2.8.5",
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.0.0",
  "pg": "^8.8.0",
  "dotenv": "^16.0.0"
}
```

## Environment Variables (.env)
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=car_rental
DB_USER=your_db_user
DB_PASSWORD=your_db_password
JWT_SECRET=your_jwt_secret_key_here
PORT=5000
```

## Required API Endpoints

### Authentication Routes
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Vehicle Routes
- `GET /api/vehicles` - Get all vehicles with optional filters
- `GET /api/vehicles/:id` - Get single vehicle details
- `POST /api/vehicles` - Create vehicle (admin only)
- `PUT /api/vehicles/:id` - Update vehicle (admin only)
- `DELETE /api/vehicles/:id` - Delete vehicle (admin only)

### Branch Routes
- `GET /api/branches` - Get all branches
- `GET /api/branches/:id` - Get single branch
- `POST /api/branches` - Create branch (admin only)
- `PUT /api/branches/:id` - Update branch (admin only)
- `DELETE /api/branches/:id` - Delete branch (admin only)

### Reservation Routes
- `GET /api/reservations` - Get all reservations (admin only)
- `GET /api/reservations/my` - Get user's reservations
- `GET /api/reservations/:id` - Get single reservation
- `POST /api/reservations` - Create reservation
- `PUT /api/reservations/:id` - Update reservation
- `DELETE /api/reservations/:id` - Delete reservation

### Payment Routes
- `GET /api/payments` - Get all payments (admin only)
- `GET /api/payments/:id` - Get single payment
- `POST /api/payments` - Create payment

### Dashboard Routes
- `GET /api/dashboard/sales-by-branch` - Sales analytics by branch
- `GET /api/dashboard/reservations-trend` - Reservation trends over time
- `GET /api/dashboard/fleet-stats` - Fleet availability statistics

## Database Schema

Based on the normalized tables from Steps 2 and 3:

### Tables
1. **customers** (customer_id, name, email, phone, address)
2. **branches** (branch_id, name, location, contact_number, email)
3. **vehicles** (vehicle_id, make, model, year, branch_id, availability, daily_rate)
4. **reservations** (reservation_id, customer_id, vehicle_id, start_date, end_date, status, total_cost)
5. **payments** (payment_id, reservation_id, amount, payment_date, payment_method, status, txn_ref)

## Sample API Response Formats

### GET /api/vehicles
```json
[
  {
    "vehicle_id": 1,
    "make": "Toyota",
    "model": "Camry",
    "year": 2023,
    "branch_id": 1,
    "branch_name": "Downtown",
    "branch_location": "123 Main St",
    "availability": true,
    "daily_rate": 55.00
  }
]
```

### GET /api/dashboard/sales-by-branch
```json
[
  {
    "branch_name": "Downtown",
    "total_sales": 15000,
    "reservation_count": 45
  }
]
```

## Security Middleware
- JWT authentication middleware for protected routes
- Admin role verification for admin routes
- Input validation and sanitization
- CORS configuration for frontend access

This backend structure will support all the frontend functionality implemented in the React application.