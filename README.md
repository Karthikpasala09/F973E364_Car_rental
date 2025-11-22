# Car Rental Application

A comprehensive full-stack car rental management system built with React, Node.js, Express, and PostgreSQL.

## 🚗 Features

### Frontend (React)
- **Authentication System**: Login/Register with JWT tokens
- **Vehicle Management**: Browse and search available vehicles
- **Reservation System**: Book vehicles with date selection and cost calculation
- **User Dashboard**: View reservations, payment history, and analytics
- **Admin Panel**: Manage vehicles, reservations, and view system analytics
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS
- **Interactive Charts**: Dashboard analytics with Chart.js

### Backend (Node.js/Express)
- **RESTful API**: Comprehensive API for all operations
- **Authentication**: JWT-based authentication with role-based access control
- **Database Integration**: PostgreSQL with connection pooling
- **Security**: Helmet, CORS, rate limiting, input validation
- **Error Handling**: Comprehensive error handling and logging
- **Payment Processing**: Payment management system
- **Analytics**: Dashboard data endpoints with aggregated statistics

### Database (PostgreSQL)
- **Normalized Schema**: Properly normalized database design
- **Data Integrity**: Foreign keys, constraints, and triggers
- **Indexing**: Optimized queries with strategic indexing
- **Views**: Pre-built views for common queries
- **Audit Trail**: Created/updated timestamps and logging

## 📁 Project Structure

```
Car Rental Application/
├── frontend/                 # React application
│   ├── public/
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   │   ├── Auth/         # Authentication components
│   │   │   ├── Dashboard/    # Dashboard components
│   │   │   ├── Layout/       # Layout components
│   │   │   ├── Reservations/ # Reservation components
│   │   │   └── Vehicles/     # Vehicle components
│   │   ├── context/          # React context providers
│   │   ├── services/         # API service functions
│   │   ├── utils/            # Utility functions
│   │   ├── App.js           # Main app component
│   │   └── index.js         # Entry point
│   ├── package.json
│   └── tailwind.config.js
│
├── backend/                  # Node.js/Express API
│   ├── middleware/           # Express middleware
│   │   ├── auth.js          # Authentication middleware
│   │   └── errorHandler.js  # Error handling middleware
│   ├── routes/              # API routes
│   │   ├── auth.js          # Authentication routes
│   │   ├── vehicles.js      # Vehicle management routes
│   │   ├── branches.js      # Branch management routes
│   │   ├── reservations.js  # Reservation management routes
│   │   ├── payments.js      # Payment processing routes
│   │   └── dashboard.js     # Analytics and dashboard routes
│   ├── utils/               # Utility modules
│   │   ├── database.js      # Database connection
│   │   └── logger.js        # Logging utility
│   ├── server.js            # Express server setup
│   └── package.json
│
├── database/                 # Database setup files
│   ├── schema.sql           # Database schema
│   ├── seed_data.sql        # Sample data for testing
│   ├── setup.sh             # Unix setup script
│   └── setup.ps1            # Windows PowerShell setup script
│
├── .env                     # Environment variables (generated)
└── README.md               # This file
```

## 🛠️ Technology Stack

### Frontend
- **React** 18.2.0 - UI framework
- **React Router** v6 - Client-side routing
- **Tailwind CSS** 3.2.0 - Utility-first CSS framework
- **Chart.js** 4.2.0 - Data visualization
- **Axios** - HTTP client for API requests
- **React Context** - State management

### Backend
- **Node.js** - JavaScript runtime
- **Express** 4.18.2 - Web framework
- **PostgreSQL** 8.11.3 - Database client
- **bcryptjs** 2.4.3 - Password hashing
- **jsonwebtoken** 9.0.2 - JWT authentication
- **express-validator** - Input validation
- **helmet** - Security middleware
- **morgan** - HTTP logging
- **winston** - Application logging

### Database
- **PostgreSQL** - Relational database
- **UUID Extension** - Unique identifier generation

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v13 or higher)
- npm or yarn package manager

### Installation

1. **Clone or download the project files**

2. **Set up the database**
   
   **Windows (PowerShell):**
   ```powershell
   cd "database"
   .\setup.ps1
   ```
   
   **Unix/Linux/Mac:**
   ```bash
   cd database
   chmod +x setup.sh
   ./setup.sh
   ```
   
   This will:
   - Create the database and user
   - Set up the schema
   - Load sample data (optional)
   - Generate the `.env` file

3. **Install and start the backend**
   ```bash
   cd backend
   npm install
   npm run dev
   ```
   
   Backend will run on http://localhost:5000

4. **Install and start the frontend**
   ```bash
   cd frontend
   npm install
   npm start
   ```
   
   Frontend will run on http://localhost:3000

## 🔑 Test Accounts

After running the setup script with sample data:

- **Admin Account**: `admin@carrental.com` / `password123`
- **Customer Account**: `alice.cooper@email.com` / `password123`

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Vehicle Endpoints
- `GET /api/vehicles` - Get all vehicles
- `GET /api/vehicles/:id` - Get vehicle by ID
- `POST /api/vehicles` - Create vehicle (Admin)
- `PUT /api/vehicles/:id` - Update vehicle (Admin)
- `DELETE /api/vehicles/:id` - Delete vehicle (Admin)
- `GET /api/vehicles/available` - Search available vehicles

### Branch Endpoints
- `GET /api/branches` - Get all branches
- `GET /api/branches/:id` - Get branch by ID
- `POST /api/branches` - Create branch (Admin)
- `PUT /api/branches/:id` - Update branch (Admin)
- `DELETE /api/branches/:id` - Delete branch (Admin)

### Reservation Endpoints
- `GET /api/reservations` - Get reservations
- `GET /api/reservations/:id` - Get reservation by ID
- `POST /api/reservations` - Create reservation
- `PUT /api/reservations/:id` - Update reservation
- `DELETE /api/reservations/:id` - Cancel reservation

### Payment Endpoints
- `GET /api/payments` - Get payments (Admin)
- `GET /api/payments/:id` - Get payment by ID
- `POST /api/payments` - Process payment
- `PUT /api/payments/:id` - Update payment status (Admin)
- `GET /api/payments/user/history` - Get user payment history

### Dashboard Endpoints
- `GET /api/dashboard/admin/stats` - Admin dashboard statistics
- `GET /api/dashboard/user/stats` - User dashboard statistics
- `GET /api/dashboard/admin/revenue` - Revenue analytics (Admin)
- `GET /api/dashboard/admin/vehicle-performance` - Vehicle analytics (Admin)
- `GET /api/dashboard/admin/branch-performance` - Branch analytics (Admin)

## 🗄️ Database Schema

### Tables
- **customers** - User accounts and authentication
- **branches** - Car rental branch locations
- **vehicles** - Vehicle inventory
- **reservations** - Vehicle bookings
- **payments** - Payment records

### Key Features
- **Foreign Key Relationships** - Proper data integrity
- **Constraints** - Data validation at database level
- **Indexes** - Optimized query performance
- **Triggers** - Automatic timestamp updates
- **Views** - Simplified complex queries

## 🔒 Security Features

- **Password Hashing** - bcrypt with salt rounds
- **JWT Authentication** - Secure token-based auth
- **Role-Based Access Control** - Admin/customer permissions
- **Input Validation** - express-validator sanitization
- **Rate Limiting** - Prevent API abuse
- **CORS Configuration** - Cross-origin request security
- **Helmet Middleware** - HTTP header security
- **SQL Injection Prevention** - Parameterized queries

## 📊 Key Features Implementation

### Vehicle Availability System
- Real-time availability checking
- Date conflict detection
- Automatic status updates

### Reservation Management
- Date validation and conflict checking
- Cost calculation with daily rates
- Status tracking (pending → confirmed → active → completed)
- Transaction-based operations

### Payment Processing
- Multiple payment methods support
- Transaction reference tracking
- Payment status management
- Integration with reservation lifecycle

### Dashboard Analytics
- Revenue tracking and trends
- Vehicle utilization rates
- Branch performance metrics
- User activity statistics

## 🔧 Configuration

### Environment Variables
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=car_rental_db
DB_USER=car_rental_user
DB_PASSWORD=car_rental_password

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# Server
NODE_ENV=development
PORT=5000

# CORS
ALLOWED_ORIGINS=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🧪 Development

### Backend Development
```bash
cd backend
npm run dev          # Start with nodemon
npm run start        # Production start
npm run test         # Run tests (if available)
```

### Frontend Development
```bash
cd frontend
npm start            # Development server
npm run build        # Production build
npm run test         # Run tests
```

### Database Management
```bash
# Connect to database
psql -h localhost -U car_rental_user -d car_rental_db

# Reset database (caution!)
cd database
psql -h localhost -U car_rental_user -d car_rental_db -f schema.sql
psql -h localhost -U car_rental_user -d car_rental_db -f seed_data.sql
```

## 🚀 Deployment

### Backend Deployment
1. Set production environment variables
2. Install dependencies: `npm install --production`
3. Build if needed: `npm run build`
4. Start: `npm start`

### Frontend Deployment
1. Build: `npm run build`
2. Serve the `build` folder with a web server

### Database Deployment
1. Create production PostgreSQL instance
2. Run schema.sql to create tables
3. Configure connection in environment variables

## 📝 License

This project is created for educational purposes. Feel free to use and modify as needed.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support

If you encounter any issues:

1. Check the console for error messages
2. Verify database connection settings
3. Ensure all dependencies are installed
4. Check that PostgreSQL service is running

## 🎯 Future Enhancements

- **Email Notifications** - Booking confirmations and reminders
- **SMS Integration** - Mobile notifications
- **Payment Gateway Integration** - Stripe/PayPal integration
- **Image Upload** - Vehicle photo management
- **Advanced Search** - Filter by features, location, price
- **Loyalty Program** - Customer rewards system
- **Mobile App** - React Native implementation
- **Multi-language Support** - Internationalization
- **Advanced Analytics** - Detailed reporting and insights
- **Maintenance Tracking** - Vehicle service management

---

**Happy coding! 🚗💨**