# Car Rental Application Database Setup Script (Windows PowerShell)
# This script sets up the PostgreSQL database for the Car Rental application

param(
    [string]$DBHost = "localhost",
    [string]$DBPort = "5432",
    [string]$DBName = "car_rental_db",
    [string]$DBUser = "car_rental_user",
    [string]$DBPassword = "car_rental_password"
)

Write-Host "🚗 Car Rental Database Setup" -ForegroundColor Green
Write-Host "=================================="

# Configuration
Write-Host "📋 Setup Configuration:" -ForegroundColor Yellow
Write-Host "Database Name: $DBName"
Write-Host "Database User: $DBUser"
Write-Host "Database Host: $DBHost"
Write-Host "Database Port: $DBPort"
Write-Host ""

# Check if PostgreSQL is installed
try {
    $null = Get-Command psql -ErrorAction Stop
    Write-Host "✅ PostgreSQL found" -ForegroundColor Green
} catch {
    Write-Host "❌ PostgreSQL is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install PostgreSQL first and ensure psql is in your PATH"
    exit 1
}

# Prompt for admin password
$PostgresPassword = Read-Host "🔑 Please enter PostgreSQL admin password (usually for 'postgres' user)" -AsSecureString
$PostgresPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($PostgresPassword))

# Set environment variable for PostgreSQL password
$env:PGPASSWORD = $PostgresPasswordPlain

# Test connection
Write-Host "🔍 Testing PostgreSQL connection..." -ForegroundColor Yellow
try {
    $result = & psql -h $DBHost -p $DBPort -U postgres -c '\q' 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Connection failed"
    }
    Write-Host "✅ PostgreSQL connection successful" -ForegroundColor Green
} catch {
    Write-Host "❌ Cannot connect to PostgreSQL. Please check your credentials and server status." -ForegroundColor Red
    exit 1
}

# Create database user
Write-Host "👤 Creating database user..." -ForegroundColor Yellow
try {
    & psql -h $DBHost -p $DBPort -U postgres -c "CREATE USER $DBUser WITH PASSWORD '$DBPassword';" 2>$null
} catch {
    Write-Host "⚠️  User might already exist, continuing..." -ForegroundColor Yellow
}

# Create database
Write-Host "🗄️  Creating database..." -ForegroundColor Yellow
try {
    & psql -h $DBHost -p $DBPort -U postgres -c "CREATE DATABASE $DBName OWNER $DBUser;" 2>$null
} catch {
    Write-Host "⚠️  Database might already exist, continuing..." -ForegroundColor Yellow
}

# Grant privileges
Write-Host "🔐 Granting privileges..." -ForegroundColor Yellow
& psql -h $DBHost -p $DBPort -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DBName TO $DBUser;"
& psql -h $DBHost -p $DBPort -U postgres -d $DBName -c "GRANT ALL ON SCHEMA public TO $DBUser;"

# Set password for database user
$env:PGPASSWORD = $DBPassword

# Run schema script
Write-Host "📋 Creating database schema..." -ForegroundColor Yellow
try {
    & psql -h $DBHost -p $DBPort -U $DBUser -d $DBName -f schema.sql
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Schema created successfully" -ForegroundColor Green
    } else {
        throw "Schema creation failed"
    }
} catch {
    Write-Host "❌ Failed to create schema" -ForegroundColor Red
    exit 1
}

# Ask if user wants to load seed data
$loadSeed = Read-Host "🌱 Would you like to load sample data for testing? (y/n)"
if ($loadSeed -match "^[Yy]$") {
    Write-Host "📊 Loading seed data..." -ForegroundColor Yellow
    try {
        & psql -h $DBHost -p $DBPort -U $DBUser -d $DBName -f seed_data.sql
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Seed data loaded successfully" -ForegroundColor Green
        } else {
            throw "Seed data loading failed"
        }
    } catch {
        Write-Host "❌ Failed to load seed data" -ForegroundColor Red
        exit 1
    }
}

# Generate random JWT secret
$JWTSecret = [Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))

# Create .env file
Write-Host "⚙️  Creating environment configuration..." -ForegroundColor Yellow
$envContent = @"
# Database Configuration
DB_HOST=$DBHost
DB_PORT=$DBPort
DB_NAME=$DBName
DB_USER=$DBUser
DB_PASSWORD=$DBPassword

# JWT Configuration
JWT_SECRET=$JWTSecret
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
"@

$envContent | Out-File -FilePath "../.env" -Encoding utf8
Write-Host "✅ Environment file created at ..\.env" -ForegroundColor Green

# Clean up password from environment
Remove-Item env:PGPASSWORD

# Display connection information
Write-Host ""
Write-Host "🎉 Database setup completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Connection Details:" -ForegroundColor Yellow
Write-Host "Database: $DBName"
Write-Host "User: $DBUser"
Write-Host "Host: $DBHost"
Write-Host "Port: $DBPort"
Write-Host ""
Write-Host "🚀 To start the application:" -ForegroundColor Yellow
Write-Host "1. cd ..\backend"
Write-Host "2. npm install"
Write-Host "3. npm run dev"
Write-Host ""
Write-Host "📱 Frontend (in another terminal):" -ForegroundColor Yellow
Write-Host "1. cd ..\frontend"
Write-Host "2. npm install"
Write-Host "3. npm start"
Write-Host ""
Write-Host "🔍 Test Accounts:" -ForegroundColor Yellow
Write-Host "Admin: admin@carrental.com / password123"
Write-Host "User: alice.cooper@email.com / password123"
Write-Host ""
Write-Host "Happy coding! 🚗💨" -ForegroundColor Green