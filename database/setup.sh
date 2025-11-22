#!/bin/bash

# Car Rental Application Database Setup Script
# This script sets up the PostgreSQL database for the Car Rental application

# Configuration
DB_NAME="car_rental_db"
DB_USER="car_rental_user"
DB_PASSWORD="car_rental_password"
DB_HOST="localhost"
DB_PORT="5432"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚗 Car Rental Database Setup${NC}"
echo "=================================="

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL is not installed or not in PATH${NC}"
    echo "Please install PostgreSQL first"
    exit 1
fi

echo -e "${YELLOW}📋 Setup Configuration:${NC}"
echo "Database Name: $DB_NAME"
echo "Database User: $DB_USER"
echo "Database Host: $DB_HOST"
echo "Database Port: $DB_PORT"
echo ""

# Prompt for admin password
echo -e "${YELLOW}🔑 Please enter PostgreSQL admin password (usually for 'postgres' user):${NC}"
read -s POSTGRES_PASSWORD

# Test connection
echo -e "${YELLOW}🔍 Testing PostgreSQL connection...${NC}"
export PGPASSWORD=$POSTGRES_PASSWORD
if ! psql -h $DB_HOST -p $DB_PORT -U postgres -c '\q' 2>/dev/null; then
    echo -e "${RED}❌ Cannot connect to PostgreSQL. Please check your credentials and server status.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ PostgreSQL connection successful${NC}"

# Create database user
echo -e "${YELLOW}👤 Creating database user...${NC}"
psql -h $DB_HOST -p $DB_PORT -U postgres -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || true

# Create database
echo -e "${YELLOW}🗄️  Creating database...${NC}"
psql -h $DB_HOST -p $DB_PORT -U postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null || true

# Grant privileges
echo -e "${YELLOW}🔐 Granting privileges...${NC}"
psql -h $DB_HOST -p $DB_PORT -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
psql -h $DB_HOST -p $DB_PORT -U postgres -d $DB_NAME -c "GRANT ALL ON SCHEMA public TO $DB_USER;"

# Run schema script
echo -e "${YELLOW}📋 Creating database schema...${NC}"
export PGPASSWORD=$DB_PASSWORD
if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f schema.sql; then
    echo -e "${GREEN}✅ Schema created successfully${NC}"
else
    echo -e "${RED}❌ Failed to create schema${NC}"
    exit 1
fi

# Ask if user wants to load seed data
echo -e "${YELLOW}🌱 Would you like to load sample data for testing? (y/n):${NC}"
read -r load_seed

if [[ $load_seed =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}📊 Loading seed data...${NC}"
    if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f seed_data.sql; then
        echo -e "${GREEN}✅ Seed data loaded successfully${NC}"
    else
        echo -e "${RED}❌ Failed to load seed data${NC}"
        exit 1
    fi
fi

# Create .env file
echo -e "${YELLOW}⚙️  Creating environment configuration...${NC}"
cat > ../.env << EOF
# Database Configuration
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD

# JWT Configuration
JWT_SECRET=$(openssl rand -base64 32)
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
EOF

echo -e "${GREEN}✅ Environment file created at ../.env${NC}"

# Display connection information
echo ""
echo -e "${GREEN}🎉 Database setup completed successfully!${NC}"
echo ""
echo -e "${YELLOW}📝 Connection Details:${NC}"
echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo "Host: $DB_HOST"
echo "Port: $DB_PORT"
echo ""
echo -e "${YELLOW}🚀 To start the application:${NC}"
echo "1. cd ../backend"
echo "2. npm install"
echo "3. npm run dev"
echo ""
echo -e "${YELLOW}📱 Frontend (in another terminal):${NC}"
echo "1. cd ../frontend"
echo "2. npm install"
echo "3. npm start"
echo ""
echo -e "${YELLOW}🔍 Test Accounts:${NC}"
echo "Admin: admin@carrental.com / password123"
echo "User: alice.cooper@email.com / password123"
echo ""
echo -e "${GREEN}Happy coding! 🚗💨${NC}"