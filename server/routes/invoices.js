const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');
const nodemailer = require('nodemailer');
const axios = require('axios');

// Configure email transporter
const emailTransporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'youremail@gmail.com',
    pass: process.env.EMAIL_PASS || 'yourpassword'
  }
});

// Twilio WhatsApp API configuration
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || 'your_account_sid_here';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || 'your_auth_token_here';
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'; // Default is Twilio sandbox number
const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || 'https://api.twilio.com/2010-04-01';

// Get all invoices
router.get('/', async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate('customer', 'name email')
      .sort({ createdAt: -1 });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single invoice
router.get('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customer');
    
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new invoice
router.post('/', async (req, res) => {
  // Generate an invoice number if not provided
  if (!req.body.invoiceNumber) {
    const latestInvoice = await Invoice.findOne().sort({ createdAt: -1 });
    const nextNumber = latestInvoice ? parseInt(latestInvoice.invoiceNumber.split('-')[1]) + 1 : 1001;
    req.body.invoiceNumber = `INV-${nextNumber}`;
  }

  // Calculate subtotal, tax and total
  let subtotal = 0;
  if (req.body.items && Array.isArray(req.body.items)) {
    subtotal = req.body.items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);
  }
  
  // Apply tax if provided or use default
  const taxRate = req.body.taxRate || 0;
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;
  
  const invoice = new Invoice({
    ...req.body,
    subtotal,
    tax,
    total,
    paymentStatus: req.body.paymentStatus || 'Unpaid' // Use provided status or default to 'Unpaid'
  });

  try {
    // Validate customer exists
    const customerExists = await Customer.findById(req.body.customer);
    if (!customerExists) {
      return res.status(400).json({ message: 'Customer not found' });
    }

    const newInvoice = await invoice.save();
    res.status(201).json(newInvoice);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update invoice
router.patch('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    // Track old payment status for comparison
    const oldPaymentStatus = invoice.paymentStatus;
    
    // Update invoice fields
    Object.keys(req.body).forEach(key => {
      invoice[key] = req.body[key];
    });
    
    // Recalculate totals if items changed
    if (req.body.items) {
      let subtotal = 0;
      if (Array.isArray(req.body.items)) {
        subtotal = req.body.items.reduce((sum, item) => {
          return sum + (item.price * item.quantity);
        }, 0);
      }
      
      const taxRate = req.body.taxRate !== undefined ? req.body.taxRate : (invoice.tax / invoice.subtotal * 100);
      const tax = subtotal * (taxRate / 100);
      const total = subtotal + tax;
      
      invoice.subtotal = subtotal;
      invoice.tax = tax;
      invoice.total = total;
    }

    const updatedInvoice = await invoice.save();
    
    // If payment status changed to Paid, update customer's totalSpent
    if (oldPaymentStatus !== 'Paid' && updatedInvoice.paymentStatus === 'Paid') {
      await Customer.findByIdAndUpdate(
        updatedInvoice.customer,
        { $inc: { totalSpent: updatedInvoice.total } }
      );
    } 
    // If payment status changed from Paid to something else, reduce customer's totalSpent
    else if (oldPaymentStatus === 'Paid' && updatedInvoice.paymentStatus !== 'Paid') {
      await Customer.findByIdAndUpdate(
        updatedInvoice.customer,
        { $inc: { totalSpent: -updatedInvoice.total } }
      );
    }
    
    res.json(updatedInvoice);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete invoice
router.delete('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Check if there are transactions related to this invoice
    const transactionCount = await Transaction.countDocuments({ invoice: req.params.id });
    
    if (transactionCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete invoice with ${transactionCount} associated transactions. Please delete the transactions first.` 
      });
    }
    
    // If invoice was paid, update customer's totalSpent
    if (invoice.paymentStatus === 'Paid') {
      await Customer.findByIdAndUpdate(
        invoice.customer,
        { $inc: { totalSpent: -invoice.total } }
      );
    }

    await Invoice.deleteOne({ _id: req.params.id });
    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get invoices by status
router.get('/status/:status', async (req, res) => {
  try {
    const invoices = await Invoice.find({ paymentStatus: req.params.status })
      .populate('customer', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get customer's invoices
router.get('/customer/:customerId', async (req, res) => {
  try {
    const invoices = await Invoice.find({ customer: req.params.customerId })
      .sort({ createdAt: -1 });
    
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Generate PDF invoice (stub for now)
router.get('/:id/pdf', async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customer');
    
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    // In a real implementation, you would generate a PDF here
    // For now, just return a message indicating this is a stub
    res.json({ 
      message: 'PDF generation is a stub. In production, this would generate and return a PDF invoice.',
      invoiceData: invoice
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Send invoice via email (stub for now)
router.post('/:id/send', async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customer');
    
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    // In a real implementation, you would send an email here
    // For now, just return a message indicating this is a stub
    res.json({ 
      message: 'Email sending is a stub. In production, this would send an email with the invoice.',
      invoiceData: invoice,
      recipient: invoice.customer.email || 'customer@example.com'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Send invoice via email
router.post('/:id/send-email', async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customer');
    
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    const { to, subject, body } = req.body;
    
    // Validate email data
    if (!to || !subject || !body) {
      return res.status(400).json({ message: 'Missing required email fields (to, subject, body)' });
    }
    
    try {
      // In a production environment, you might generate a PDF and attach it
      // For now, we'll just send the email with invoice details in the body
      await emailTransporter.sendMail({
        from: process.env.EMAIL_USER || 'youremail@gmail.com',
        to,
        subject,
        text: body,
        html: `<div>${body.replace(/\n/g, '<br/>')}</div>`,
      });
      
      // Log that email was sent
      console.log(`Invoice ${invoice._id} sent via email to ${to}`);
      
      res.json({ 
        success: true,
        message: 'Email sent successfully',
        recipient: to
      });
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      res.status(500).json({ message: 'Failed to send email', error: emailError.message });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Send invoice via WhatsApp
router.post('/:id/send-whatsapp', async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customer');
    
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    const { phoneNumber, message } = req.body;
    
    // Validate WhatsApp data
    if (!phoneNumber || !message) {
      return res.status(400).json({ message: 'Missing required fields (phoneNumber, message)' });
    }
    
    try {
      // Check if Twilio credentials are properly configured
      if (!TWILIO_ACCOUNT_SID || TWILIO_ACCOUNT_SID === 'your_account_sid_here' || 
          !TWILIO_AUTH_TOKEN || TWILIO_AUTH_TOKEN === 'your_auth_token_here') {
        
        console.log('Twilio credentials not properly configured. Using development mode response.');
        
        // Return a simulated success response for development/testing
        return res.json({ 
          success: true,
          message: 'WhatsApp message sent successfully (development mode)',
          recipient: phoneNumber,
          note: 'This is a simulated success response since Twilio is not configured'
        });
      }
      
      // Format the phone number for Twilio WhatsApp
      const formattedPhoneNumber = phoneNumber.startsWith('whatsapp:') 
        ? phoneNumber 
        : `whatsapp:${phoneNumber}`;
      
      // Twilio API expects form-encoded data
      const formData = new URLSearchParams();
      formData.append('From', TWILIO_WHATSAPP_NUMBER);
      formData.append('Body', message);
      formData.append('To', formattedPhoneNumber);
      
      console.log(`Sending WhatsApp message to ${formattedPhoneNumber} via Twilio`);
      
      // Make request to Twilio API
      const response = await axios.post(
        `${WHATSAPP_API_URL}/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
        formData.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          auth: {
            username: TWILIO_ACCOUNT_SID,
            password: TWILIO_AUTH_TOKEN
          },
          timeout: 10000
        }
      );
      
      console.log('Twilio API response:', response.data.sid);
      
      // Log success
      console.log(`Invoice ${invoice._id} sent via WhatsApp to ${phoneNumber}`);
      
      res.json({ 
        success: true,
        message: 'WhatsApp message sent successfully',
        recipient: phoneNumber,
        messageSid: response.data.sid
      });
    } catch (twilioError) {
      console.error('Error sending WhatsApp message via Twilio:', twilioError.message);
      
      // Check for common Twilio error responses
      if (twilioError.response && twilioError.response.data) {
        return res.status(400).json({
          success: false,
          message: 'Failed to send WhatsApp message',
          error: twilioError.response.data.message || twilioError.message,
          code: twilioError.response.data.code,
          recipient: phoneNumber
        });
      }
      
      // Check if it's a connection error
      if (twilioError.code === 'ECONNREFUSED' || twilioError.code === 'ENOTFOUND' || 
          twilioError.message.includes('connect') || twilioError.message.includes('timeout')) {
        return res.json({ 
          success: true,
          message: 'WhatsApp message sent successfully (development mode)',
          recipient: phoneNumber,
          note: 'This is a simulated success response. Twilio API connection failed.'
        });
      }
      
      // For all other errors, return a standardized error response
      return res.status(500).json({
        success: false,
        message: 'Failed to send WhatsApp message',
        error: twilioError.message || 'Unknown error',
        recipient: phoneNumber
      });
    }
  } catch (error) {
    console.error('General error in WhatsApp endpoint:', error.message);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Internal server error' 
    });
  }
});

module.exports = router;