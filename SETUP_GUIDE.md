# Car Rental Application - Quick Setup Guide

## Step 1: Install PostgreSQL (Required)

1. **Download PostgreSQL:**
   - Go to https://www.postgresql.org/download/windows/
   - Download the Windows installer (recommended version 15 or 16)

2. **Install PostgreSQL:**
   - Run the installer
   - Set a password for the 'postgres' user (remember this!)
   - Default port: 5432
   - Make sure to install pgAdmin (GUI tool)

3. **Add PostgreSQL to PATH:**
   - Open System Properties → Advanced → Environment Variables
   - Add `C:\Program Files\PostgreSQL\[version]\bin` to your PATH
   - Or restart your terminal after installation

## Step 2: Setup Database (After PostgreSQL Installation)

Open PowerShell and run:
```powershell
cd "c:\Users\katarivenkatadurga_s\Desktop\Car Rental Application\database"

# Connect to PostgreSQL and create database
psql -U postgres -h localhost

# In PostgreSQL shell, run these commands:
CREATE DATABASE car_rental_db;
CREATE USER car_rental_user WITH PASSWORD 'car_rental_password';
GRANT ALL PRIVILEGES ON DATABASE car_rental_db TO car_rental_user;
\q

# Setup the schema and data
psql -U car_rental_user -d car_rental_db -h localhost -f schema.sql
psql -U car_rental_user -d car_rental_db -h localhost -f seed_data.sql
```

## Step 3: Create Environment File

Create `.env` file in the root directory with:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=car_rental_db
DB_USER=car_rental_user
DB_PASSWORD=car_rental_password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
JWT_EXPIRES_IN=24h

# Server Configuration
NODE_ENV=development
PORT=5000

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

## Step 4: Run Backend API

```powershell
cd "c:\Users\katarivenkatadurga_s\Desktop\Car Rental Application\backend"
npm install
npm run dev
```

Backend will run on: http://localhost:5000

## Step 5: Run Frontend Application

Open a NEW PowerShell window:
```powershell
cd "c:\Users\katarivenkatadurga_s\Desktop\Car Rental Application\frontend"
npm install
npm start
```

Frontend will run on: http://localhost:3000

## Step 6: Test the Application

**Test Accounts:**
- Admin: `admin@carrental.com` / `password123`
- Customer: `alice.cooper@email.com` / `password123`

## Quick Alternative: Using SQLite (If you prefer not to install PostgreSQL)

If you want to skip PostgreSQL installation, I can help you modify the backend to use SQLite instead, which requires no separate database installation.

Would you like me to create an SQLite version for easier setup?

---

## Troubleshooting

1. **PostgreSQL Connection Error:**
   - Make sure PostgreSQL service is running
   - Check username/password
   - Verify database exists

2. **Port Already in Use:**
   - Change PORT in .env file
   - Kill existing Node.js processes

3. **Frontend won't start:**
   - Make sure Node.js is installed
   - Run `npm install` first
   - Check for port conflicts

4. **Backend API errors:**
   - Check database connection
   - Verify .env file exists
   - Check console for error messages