const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Invoice = require('../models/Invoice');
const Transaction = require('../models/Transaction');

// Get all customers
router.get('/', async (req, res) => {
  try {
    const customers = await Customer.find().sort({ name: 1 });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single customer
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new customer
router.post('/', async (req, res) => {
  const customer = new Customer(req.body);

  try {
    const newCustomer = await customer.save();
    res.status(201).json(newCustomer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update customer
router.patch('/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Update nested objects properly
    if (req.body.address) {
      customer.address = { ...customer.address, ...req.body.address };
      delete req.body.address;
    }

    if (req.body.billingInfo) {
      customer.billingInfo = { ...customer.billingInfo, ...req.body.billingInfo };
      delete req.body.billingInfo;
    }

    // Update all other fields
    Object.keys(req.body).forEach(key => {
      customer[key] = req.body[key];
    });

    const updatedCustomer = await customer.save();
    res.json(updatedCustomer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete customer
router.delete('/:id', async (req, res) => {
  try {
    // Check if customer has any invoices
    const hasInvoices = await Invoice.exists({ customer: req.params.id });
    if (hasInvoices) {
      return res.status(400).json({ message: 'Cannot delete customer with existing invoices' });
    }

    // Check if customer has any transactions
    const hasTransactions = await Transaction.exists({ customer: req.params.id });
    if (hasTransactions) {
      return res.status(400).json({ message: 'Cannot delete customer with existing transactions' });
    }

    const result = await Customer.deleteOne({ _id: req.params.id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get customer's invoices
router.get('/:id/invoices', async (req, res) => {
  try {
    const invoices = await Invoice.find({ customer: req.params.id })
      .sort({ createdAt: -1 });
    
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get customer statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    // Get all invoices for this customer
    const invoices = await Invoice.find({ customer: req.params.id });
    
    // Calculate total invoiced amount
    const totalInvoiced = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
    
    // Count invoices by status
    const invoicesByStatus = {
      paid: invoices.filter(i => i.paymentStatus === 'Paid').length,
      partial: invoices.filter(i => i.paymentStatus === 'Partial').length,
      unpaid: invoices.filter(i => i.paymentStatus === 'Unpaid').length,
      overdue: invoices.filter(i => 
        i.paymentStatus !== 'Paid' && 
        new Date(i.dueDate) < new Date()
      ).length
    };
    
    // Get recent transactions
    const recentTransactions = await Transaction.find({ customer: req.params.id })
      .sort({ date: -1 })
      .limit(5)
      .populate('invoice', 'invoiceNumber');
    
    res.json({
      totalInvoiced,
      totalSpent: customer.totalSpent || 0,
      outstandingAmount: totalInvoiced - (customer.totalSpent || 0),
      invoiceCount: invoices.length,
      invoicesByStatus,
      recentTransactions
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;