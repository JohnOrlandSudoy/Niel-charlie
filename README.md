# Restaurant Management System with RBAC Authentication

A comprehensive restaurant management application built with React, TypeScript, and Tailwind CSS, featuring role-based access control (RBAC) for three user roles: Admin, Cashier, and Kitchen.

## Features

### 🔐 Authentication System
- **User Registration & Login**: Secure authentication with form validation
- **Role-Based Access Control**: Three distinct user roles with different permissions
- **Session Management**: Persistent login sessions using localStorage
- **Password Security**: Password hashing with bcryptjs (ready for production)

### 👥 User Roles & Permissions

#### Admin Role
- Full access to all system features
- Dashboard with comprehensive analytics
- Inventory management
- Menu management
- Employee management
- Order history
- Payroll management
- System settings

#### Cashier Role
- Order management and customer service
- Payment processing
- Customer information
- Limited access to financial data
- No access to admin features

#### Kitchen Role
- Order preparation tracking
- Food status management
- Kitchen inventory monitoring
- Equipment status
- No access to financial or admin features

### 🎨 User Interface
- **Responsive Design**: Mobile-friendly interface
- **Modern UI**: Clean, professional design with Tailwind CSS
- **Role-Specific Dashboards**: Customized interfaces for each user type
- **Interactive Components**: Charts, tables, and real-time updates

## Technology Stack

- **Frontend**: React 18.3.1 + TypeScript 5.5.3
- **Build Tool**: Vite 5.4.2
- **Styling**: Tailwind CSS 3.4.1
- **Routing**: React Router DOM
- **Forms**: React Hook Form
- **Icons**: Lucide React
- **Authentication**: Custom RBAC system (ready for Supabase integration)

## Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd adminRestu
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

## Testing the Application

### Demo Credentials

The system comes with pre-configured demo users for testing:

| Role | Username | Password |
|------|----------|----------|
| **Admin** | `admin` | `admin123` |
| **Cashier** | `cashier` | `cashier123` |
| **Kitchen** | `kitchen` | `kitchen123` |

### Testing Workflow

1. **Access the Application**
   - Open `http://localhost:5173`
   - You'll be redirected to the sign-in page

2. **Test Different Roles**
   - Sign in with different demo accounts
   - Each role will be redirected to their specific dashboard
   - Test role-based access restrictions

3. **Test Authentication Features**
   - Try accessing unauthorized routes
   - Test logout functionality
   - Verify session persistence

4. **Test Role-Specific Features**
   - **Admin**: Access all modules and features
   - **Cashier**: Focus on order management and payments
   - **Kitchen**: Focus on food preparation and order status

### Testing Scenarios

#### Authentication Testing
- ✅ Valid login with correct credentials
- ✅ Invalid login with wrong credentials
- ✅ User registration with role selection
- ✅ Session persistence across page refreshes
- ✅ Proper logout and session cleanup

#### Authorization Testing
- ✅ Admin can access all features
- ✅ Cashier cannot access admin features
- ✅ Kitchen cannot access financial data
- ✅ Proper redirects for unauthorized access
- ✅ Role-based UI customization

#### UI/UX Testing
- ✅ Responsive design on different screen sizes
- ✅ Form validation and error handling
- ✅ Loading states and user feedback
- ✅ Navigation between different sections
- ✅ Consistent styling across components

## Project Structure

```
src/
├── components/
│   ├── Auth/                 # Authentication components
│   │   ├── SignIn.tsx       # Login form
│   │   ├── SignUp.tsx       # Registration form
│   │   └── ProtectedRoute.tsx # Route protection
│   ├── Layout/              # Layout components
│   │   ├── AdminLayout.tsx  # Admin dashboard layout
│   │   ├── CashierLayout.tsx # Cashier dashboard layout
│   │   ├── KitchenLayout.tsx # Kitchen dashboard layout
│   │   ├── Header.tsx       # Header with user info
│   │   └── Sidebar.tsx      # Navigation sidebar
│   ├── Dashboard/           # Admin dashboard components
│   ├── Inventory/           # Inventory management
│   ├── Menu/                # Menu management
│   ├── Cashier/             # Cashier-specific components
│   └── Kitchen/             # Kitchen-specific components
├── contexts/
│   └── AuthContext.tsx      # Authentication context
├── types/
│   └── auth.ts              # TypeScript interfaces
├── utils/
│   └── auth.ts              # Authentication utilities
└── App.tsx                  # Main application component
```

## Future Enhancements

### Supabase Integration
The authentication system is designed to be easily migrated to Supabase:

1. **Replace AuthService methods** with Supabase Auth calls
2. **Store user roles** in a separate Supabase table
3. **Use Supabase JWT** for session management
4. **Implement real-time features** with Supabase subscriptions

### Additional Features
- Real-time order notifications
- Advanced analytics and reporting
- Mobile app development
- Integration with POS systems
- Customer relationship management
- Advanced inventory forecasting

## Development Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Security Considerations

- **Password Hashing**: All passwords are hashed using bcryptjs
- **Route Protection**: Client-side route guards prevent unauthorized access
- **Input Validation**: Form inputs are validated using React Hook Form
- **Session Management**: Secure session handling with localStorage
- **Role-Based Access**: Strict permission checking for all routes

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For questions or support, please open an issue in the repository or contact the development team.

---

**Note**: This is a development version with mock data. For production use, integrate with a real backend database and implement proper security measures.
