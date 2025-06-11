# 📋 Invoice Dashboard

A modern, full-stack invoice management system built with **Next.js 15**, **MongoDB**, and **Express.js**. Manage customers, create invoices, track orders, handle transactions, and generate professional PDF documents with ease.

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)

## ✨ Features

### 🎯 Core Functionality

- **Invoice Management** - Create, edit, view, and track invoices
- **Customer Management** - Comprehensive customer database
- **Order Processing** - Order creation and status tracking
- **Transaction Tracking** - Financial transaction management
- **Business Profile** - Company information and settings

### 📄 PDF Generation

- **Advanced PDF Export** - Professional PDF generation for invoices, orders, and transactions
- **OKLCH Color Support** - Enhanced color processing with OKLCH color function compatibility
- **Multiple Export Options** - Individual documents and bulk table exports
- **Print-Ready Layouts** - Optimized for printing and digital sharing

### 🎨 User Experience

- **Dark/Light Theme** - System-aware theme switching
- **Responsive Design** - Mobile-first responsive layout
- **Modern UI Components** - Built with Radix UI and Tailwind CSS
- **Real-time Updates** - Dynamic data updates without page refresh

### 🔐 Authentication & Security

- **JWT Authentication** - Secure user authentication
- **Protected Routes** - Role-based access control
- **Data Validation** - Comprehensive input validation
- **Error Handling** - Robust error management

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 18.0.0
- **MongoDB** (local or Atlas)
- **npm** or **yarn**

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd invoice-dashboard
   ```

2. **Install frontend dependencies**

   ```bash
   npm install
   ```

3. **Install backend dependencies**

   ```bash
   cd server
   npm install express mongoose cors dotenv bcryptjs jsonwebtoken
   cd ..
   ```

4. **Environment Setup**

   Create `.env` in the `server` directory:

   ```env
   MONGODB_URI=mongodb://localhost:27017/invoice-dashboard
   JWT_SECRET=your-super-secret-jwt-key
   PORT=5002
   NODE_ENV=development
   ```

5. **Start the application**

   **Option 1: Start both servers simultaneously**

   ```bash
   npm run dev:all
   ```

   **Option 2: Start individually**

   ```bash
   # Terminal 1 - Frontend (Next.js)
   npm run dev

   # Terminal 2 - Backend (Express.js)
   npm run server
   ```

6. **Access the application**
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:5002

## 📁 Project Structure

```
invoice-dashboard/
├── src/                          # Frontend source code
│   ├── app/                      # Next.js 15 app directory
│   │   ├── dashboard/            # Main dashboard
│   │   ├── invoices/             # Invoice management
│   │   ├── customers/            # Customer management
│   │   ├── orders/               # Order management
│   │   ├── transactions/         # Transaction management
│   │   ├── business-profile/     # Business settings
│   │   └── settings/             # User preferences
│   ├── components/               # Reusable UI components
│   │   ├── layouts/              # Layout components
│   │   └── ui/                   # UI library components
│   ├── context/                  # React context providers
│   └── lib/                      # Utilities and API clients
├── server/                       # Backend source code
│   ├── models/                   # MongoDB schemas
│   ├── routes/                   # Express.js routes
│   └── server.js                 # Express server entry point
└── public/                       # Static assets
```

## 🛠️ Tech Stack

### Frontend

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI, shadcn/ui
- **Icons**: Lucide React
- **PDF Generation**: html2canvas, jsPDF
- **Form Handling**: React Hook Form
- **State Management**: React Context API

### Backend

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Environment**: dotenv

## 📊 API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Customers

- `GET /api/customers` - List all customers
- `POST /api/customers` - Create new customer
- `GET /api/customers/:id` - Get customer details
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Invoices

- `GET /api/invoices` - List all invoices
- `POST /api/invoices` - Create new invoice
- `GET /api/invoices/:id` - Get invoice details
- `PUT /api/invoices/:id` - Update invoice
- `DELETE /api/invoices/:id` - Delete invoice
- `POST /api/invoices/:id/send-email` - Send invoice via email
- `POST /api/invoices/:id/send-whatsapp` - Send invoice via WhatsApp

### Orders

- `GET /api/orders` - List all orders
- `POST /api/orders` - Create new order
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id` - Update order
- `DELETE /api/orders/:id` - Delete order

### Transactions

- `GET /api/transactions` - List all transactions
- `POST /api/transactions` - Create new transaction
- `GET /api/transactions/:id` - Get transaction details
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Business Profile

- `GET /api/business-profile` - Get business profile
- `PUT /api/business-profile` - Update business profile

## 🎨 UI Components

The application uses a comprehensive UI component library built on Radix UI:

- **Form Controls**: Input, Select, Textarea, Checkbox
- **Navigation**: Tabs, Dialog, Separator
- **Feedback**: Badge, Card, Button variants
- **Layout**: Responsive grid system, flexbox utilities
- **Specialized**: PDFDownloadButton, PDFPrintPreview

## 📱 Features in Detail

### Invoice Management

- Create professional invoices with itemized billing
- Multiple tax rates and currency support
- Payment status tracking (Paid, Pending, Overdue)
- Email and WhatsApp invoice sharing
- PDF generation with company branding

### PDF Generation System

Our advanced PDF generation system includes:

- **OKLCH Color Processing**: Converts modern OKLCH color functions to PDF-compatible RGB
- **Responsive Layouts**: Optimized for various paper sizes
- **Print Optimization**: Clean, professional layouts for printing
- **Bulk Export**: Export multiple records as tables

### Customer Management

- Comprehensive customer profiles
- Contact information and billing addresses
- Transaction history and invoice tracking
- Customer communication logs

### Order Processing

- Order creation with multiple items
- Status tracking (Pending, Processing, Shipped, Delivered)
- Customer assignment and order history
- Integration with invoice generation

## 🔧 Configuration

### Environment Variables

**Server (.env)**

```env
# Database
MONGODB_URI=mongodb://localhost:27017/invoice-dashboard

# Authentication
JWT_SECRET=your-super-secret-jwt-key

# Server
PORT=5002
NODE_ENV=development

# Optional: Email configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Optional: WhatsApp API
WHATSAPP_API_URL=https://api.whatsapp.com
WHATSAPP_API_KEY=your-whatsapp-api-key
```

### MongoDB Setup

**Local MongoDB:**

```bash
# Install MongoDB
brew install mongodb/brew/mongodb-community

# Start MongoDB service
brew services start mongodb/brew/mongodb-community
```

**MongoDB Atlas (Cloud):**

1. Create account at [MongoDB Atlas](https://cloud.mongodb.com)
2. Create cluster and get connection string
3. Replace `MONGODB_URI` in `.env` file

### Database (MongoDB Atlas)

1. Create MongoDB Atlas cluster
2. Update `MONGODB_URI` in production environment
3. Configure IP whitelist and database users

## 🧪 Testing

### Test User Account

For development and testing:

- **Email**: test@example.com
- **Password**: password123

### API Testing

```bash
# Install testing tools
npm install -g newman

# Test API endpoints
curl -X GET http://localhost:5002/api/customers
```

## 🛡️ Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs for secure password storage
- **Input Validation**: Comprehensive data validation
- **CORS Configuration**: Proper cross-origin resource sharing
- **Error Handling**: Sanitized error messages for production

## 🐛 Known Issues & Solutions

### OKLCH Color Functions in PDF

**Issue**: PDF generation fails with OKLCH color function errors
**Solution**: ✅ **RESOLVED** - Enhanced PDF utilities with comprehensive OKLCH preprocessing

### Theme Persistence

**Issue**: Theme preferences not persisting across sessions
**Solution**: ✅ **RESOLVED** - localStorage integration in settings page

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use meaningful commit messages
- Add comments for complex logic
- Test features thoroughly before committing

## 👨‍💻 Author

Created with ❤️ for modern business invoice management.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Radix UI](https://www.radix-ui.com/) - Unstyled UI components
- [MongoDB](https://www.mongodb.com/) - NoSQL database
- [Vercel](https://vercel.com/) - Deployment platform

---

**📞 Support**: For issues and questions, please open a GitHub issue or contact the development team.

**🔄 Updates**: This README is regularly updated. Check back for the latest information and features.
