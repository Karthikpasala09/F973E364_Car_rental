# Car Rental Frontend Application

This is the frontend React application for the Car Rental Reservation System, built as part of Step 4 of the CS 665 project.

## Features

### ✅ Authentication
- User login and registration with JWT tokens
- Secure password handling with bcrypt validation
- Protected routes based on authentication status
- Role-based access control (admin vs regular user)

### ✅ Vehicle Management
- Browse vehicles with filtering by branch, make, and availability
- Search functionality across vehicle details
- Detailed vehicle information pages
- Admin interface for adding/editing/deleting vehicles

### ✅ Reservation Flow
- Complete booking flow: vehicle selection → date picking → confirmation → payment
- Interactive date picker with validation
- Payment simulation with multiple payment methods
- Reservation confirmation and tracking

### ✅ Dashboard & Analytics
- Interactive charts showing:
  - Sales by Branch (Bar Chart)
  - Reservations Trend (Line Chart)  
  - Fleet Availability (Pie Chart)
- Key performance indicators (KPIs)
- Branch performance table

### ✅ Admin Features
- Vehicle management (CRUD operations)
- Branch management (CRUD operations)
- Role-based access control
- Comprehensive admin dashboard

### ✅ User Experience
- Responsive design with Tailwind CSS
- Professional UI components
- Loading states and error handling
- Mobile-friendly navigation

## Technology Stack

- **Frontend Framework:** React 18
- **Routing:** React Router v6
- **Styling:** Tailwind CSS
- **Charts:** Chart.js with react-chartjs-2
- **HTTP Client:** Axios
- **Date Handling:** react-datepicker
- **State Management:** React Context API
- **Authentication:** JWT tokens with localStorage

## Prerequisites

- Node.js v16 or higher
- npm or yarn package manager
- Backend API server running (typically on http://localhost:5000)

## Installation & Setup

1. **Navigate to the frontend directory:**
   ```powershell
   cd "C:\Users\katarivenkatadurga_s\Desktop\Car Rental Application\frontend"
   ```

2. **Install dependencies:**
   ```powershell
   npm install
   ```

3. **Create environment variables (optional):**
   Create a `.env` file in the frontend directory:
   ```
   REACT_APP_API_URL=http://localhost:5000/api
   ```

4. **Start the development server:**
   ```powershell
   npm start
   ```

5. **Access the application:**
   Open your browser and navigate to `http://localhost:3000`

## Available Scripts

### Development
- `npm start` - Runs the app in development mode
- `npm test` - Launches the test runner
- `npm run build` - Builds the app for production
- `npm run eject` - Ejects from Create React App (irreversible)

## Application Structure

```
src/
├── components/
│   ├── auth/
│   │   ├── Login.js          # User login form
│   │   └── Register.js       # User registration form
│   ├── vehicles/
│   │   ├── VehicleList.js    # Vehicle listing with filters
│   │   └── VehicleDetail.js  # Individual vehicle details
│   ├── reservations/
│   │   ├── ReservationFlow.js # Complete booking process
│   │   └── MyReservations.js  # User's reservation history
│   ├── admin/
│   │   ├── VehicleManagement.js # Admin vehicle CRUD
│   │   └── BranchManagement.js  # Admin branch CRUD
│   ├── dashboard/
│   │   └── Dashboard.js      # Analytics dashboard with charts
│   ├── layout/
│   │   └── Navbar.js         # Navigation component
│   ├── ProtectedRoute.js     # Route protection wrapper
│   └── HomePage.js           # Landing page
├── contexts/
│   └── AuthContext.js        # Authentication context provider
├── services/
│   └── api.js               # API service functions
├── index.css                # Global styles with Tailwind
├── index.js                 # React entry point
└── App.js                   # Main app component with routing
```

## Key Components Overview

### Authentication System
- **AuthContext:** Manages user authentication state globally
- **Protected Routes:** Ensures only authenticated users access protected content
- **Role-based Access:** Admin-only routes for management functions

### Vehicle Booking Flow
1. **Vehicle List:** Browse and filter available vehicles
2. **Vehicle Details:** View detailed information about selected vehicle
3. **Reservation Flow:** Multi-step booking process with date selection and payment
4. **Confirmation:** Booking confirmation with reservation details

### Dashboard Analytics
- Real-time charts showing business metrics
- Sales performance by branch
- Reservation trends over time
- Fleet utilization statistics

### Admin Management
- Complete CRUD operations for vehicles and branches
- Form validation and error handling
- Bulk operations and data management

## API Integration

The frontend communicates with the backend API through the following endpoints:

### Authentication
- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration

### Vehicles
- `GET /api/vehicles` - List vehicles with filters
- `GET /api/vehicles/:id` - Get vehicle details
- `POST /api/vehicles` - Create vehicle (admin)
- `PUT /api/vehicles/:id` - Update vehicle (admin)
- `DELETE /api/vehicles/:id` - Delete vehicle (admin)

### Reservations
- `GET /api/reservations/my` - User's reservations
- `POST /api/reservations` - Create reservation
- `GET /api/reservations/:id` - Get reservation details

### Payments
- `POST /api/payments` - Process payment

### Dashboard
- `GET /api/dashboard/sales-by-branch` - Sales analytics
- `GET /api/dashboard/reservations-trend` - Reservation trends
- `GET /api/dashboard/fleet-stats` - Fleet statistics

## Responsive Design

The application is fully responsive and works on:
- Desktop computers (1024px+)
- Tablets (768px - 1023px)
- Mobile phones (up to 767px)

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## User Roles

### Regular Users
- Browse and search vehicles
- Make reservations
- View reservation history
- Manage profile

### Administrators
- All regular user features
- Add/edit/delete vehicles
- Add/edit/delete branches
- View dashboard analytics
- Manage all reservations

## Sample User Accounts

Once the backend is set up with test data, you can use these sample accounts:

**Regular User:**
- Email: customer@example.com
- Password: password123

**Administrator:**
- Email: admin@example.com  
- Password: admin123

## Development Notes

- The application uses mock data fallbacks if the backend API is unavailable
- All forms include proper validation and error handling
- Loading states are implemented for better user experience
- The UI follows modern design principles with consistent spacing and typography

## Production Build

To create a production build:

```powershell
npm run build
```

This creates a `build` directory with optimized files ready for deployment.

## Troubleshooting

### Common Issues

1. **API Connection Errors:**
   - Ensure the backend server is running
   - Check the API URL in environment variables
   - Verify CORS settings on the backend

2. **Authentication Issues:**
   - Clear localStorage if tokens are corrupted
   - Check token expiration and refresh logic

3. **Build Errors:**
   - Delete `node_modules` and run `npm install` again
   - Check for any missing dependencies

### Performance Optimization

- Images are optimized for web
- Components use React.memo where appropriate
- API calls are debounced for search functionality
- Charts are lazy-loaded to improve initial page load

## Next Steps

For Step 5 of the project, this codebase is ready to be committed to a GitHub repository with proper commit messages and documentation.