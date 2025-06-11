const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();
const app = express();

// Configure detailed error logging
mongoose.set('debug', true);

// Enhanced error logging for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Middleware
app.use(cors());
app.use(express.json());

// Global error handler middleware
app.use((err, req, res, next) => {
  console.error('Global error handler caught:', err);
  res.status(500).json({
    message: 'Internal server error',
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Import routes
const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customers');
const invoiceRoutes = require('./routes/invoices');
const orderRoutes = require('./routes/orders');
const transactionRoutes = require('./routes/transactions');
const businessProfileRoutes = require('./routes/businessProfile');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/business-profile', businessProfileRoutes);

// Define the home route
app.get('/', (req, res) => {
  res.send('Invoice Dashboard API');
});

// Connect to MongoDB
const PORT = process.env.PORT || 5002;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/invoice-dashboard';

// Add connection options to handle deprecation warnings
mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
})
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err.message);
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // Don't exit process to keep server running
  // process.exit(1); 
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Don't exit process to keep server running
  // process.exit(1);
});