const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');

// Get all transactions
router.get('/', async (req, res) => {
  try {
    console.log('GET /transactions - Starting request');
    
    // Populate customer information to ensure frontend has access to customer name
    const transactions = await Transaction.find({})
      .populate('customer', 'name email')
      .lean()
      .exec();
    
    console.log(`GET /transactions - Found ${transactions.length} transactions`);
    
    // Return the populated transactions
    return res.json(transactions);
  } catch (error) {
    console.error('Error in GET /transactions:', error);
    
    // Even in case of error, return HTTP 200 with empty array to prevent frontend errors
    return res.status(200).json([]);
  }
});

// Get single transaction
router.get('/:id', async (req, res) => {
  try {
    console.log(`GET /transactions/${req.params.id} - Fetching single transaction`);
    
    // Use more detailed population to ensure we get all needed customer fields
    const transaction = await Transaction.findById(req.params.id)
      .populate({
        path: 'customer',
        select: 'name email phone company'
      })
      .populate({
        path: 'invoice',
        select: 'invoiceNumber totalAmount date dueDate status'
      });
    
    if (!transaction) {
      console.log(`Transaction not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    console.log(`Transaction found:`, {
      id: transaction._id,
      transactionId: transaction.transactionId,
      amount: transaction.amount,
      customerPopulated: !!transaction.customer,
      customer: transaction.customer ? 
        (typeof transaction.customer === 'object' ? 
          { id: transaction.customer._id, name: transaction.customer.name } : 
          transaction.customer) 
        : null
    });
    
    res.json(transaction);
  } catch (error) {
    console.error(`Error fetching transaction ${req.params.id}:`, error);
    res.status(500).json({ message: error.message });
  }
});

// Create new transaction
router.post('/', async (req, res) => {
  // Generate a transaction ID if not provided
  if (!req.body.transactionId) {
    req.body.transactionId = `TXN-${Date.now()}`;
  }

  const transaction = new Transaction(req.body);

  try {
    // Validate customer exists
    const customerExists = await Customer.findById(req.body.customer);
    if (!customerExists) {
      return res.status(400).json({ message: 'Customer not found' });
    }

    // Validate invoice exists if provided
    if (req.body.invoice) {
      const invoiceExists = await Invoice.findById(req.body.invoice);
      if (!invoiceExists) {
        return res.status(400).json({ message: 'Invoice not found' });
      }

      // If this is a payment and the transaction status is completed, update invoice payment status
      if (req.body.type === 'Payment' && req.body.status === 'Completed') {
        const invoice = invoiceExists;
        const totalInvoiceAmount = invoice.total;
        
        // Find all completed payments for this invoice
        const existingPayments = await Transaction.find({
          invoice: invoice._id,
          type: 'Payment',
          status: 'Completed'
        });
        
        // Calculate total paid amount including this new transaction
        const totalPaid = existingPayments.reduce((sum, t) => sum + t.amount, 0) + parseFloat(req.body.amount);
        
        // Update invoice payment status
        let paymentStatus;
        if (totalPaid >= totalInvoiceAmount) {
          paymentStatus = 'Paid';
        } else if (totalPaid > 0) {
          paymentStatus = 'Partial';
        } else {
          paymentStatus = 'Unpaid';
        }
        
        await Invoice.findByIdAndUpdate(
          invoice._id,
          { paymentStatus, lastPaymentDate: new Date() }
        );
        
        // If the invoice status is being changed to 'Paid', update customer's totalSpent
        if (paymentStatus === 'Paid' && invoice.paymentStatus !== 'Paid') {
          await Customer.findByIdAndUpdate(
            invoice.customer,
            { $inc: { totalSpent: invoice.total } }
          );
        }
      }
    }

    const newTransaction = await transaction.save();
    res.status(201).json(newTransaction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update transaction
router.patch('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    // Store old values for comparison
    const oldStatus = transaction.status;
    const oldAmount = transaction.amount;
    const oldType = transaction.type;
    
    // Update transaction fields
    Object.keys(req.body).forEach(key => {
      transaction[key] = req.body[key];
    });

    const updatedTransaction = await transaction.save();
    
    // If this transaction is linked to an invoice and its status or amount changed
    if (transaction.invoice && 
        (oldStatus !== updatedTransaction.status || 
         oldAmount !== updatedTransaction.amount ||
         oldType !== updatedTransaction.type)) {
      
      // Recalculate invoice payment status
      const invoice = await Invoice.findById(transaction.invoice);
      if (invoice) {
        const totalInvoiceAmount = invoice.total;
        
        // Find all completed payments for this invoice
        const payments = await Transaction.find({
          invoice: invoice._id,
          type: 'Payment',
          status: 'Completed'
        });
        
        // Calculate total paid amount
        const totalPaid = payments.reduce((sum, t) => sum + t.amount, 0);
        
        // Update invoice payment status
        let paymentStatus;
        if (totalPaid >= totalInvoiceAmount) {
          paymentStatus = 'Paid';
        } else if (totalPaid > 0) {
          paymentStatus = 'Partial';
        } else {
          paymentStatus = 'Unpaid';
        }
        
        await Invoice.findByIdAndUpdate(
          invoice._id,
          { paymentStatus, lastPaymentDate: new Date() }
        );
        
        // Handle customer's totalSpent update based on invoice status changes
        if (paymentStatus === 'Paid' && invoice.paymentStatus !== 'Paid') {
          await Customer.findByIdAndUpdate(
            invoice.customer,
            { $inc: { totalSpent: invoice.total } }
          );
        } else if (paymentStatus !== 'Paid' && invoice.paymentStatus === 'Paid') {
          await Customer.findByIdAndUpdate(
            invoice.customer,
            { $inc: { totalSpent: -invoice.total } }
          );
        }
      }
    }
    
    res.json(updatedTransaction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete transaction
router.delete('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // If this transaction is linked to an invoice, update invoice payment status
    if (transaction.invoice && transaction.type === 'Payment' && transaction.status === 'Completed') {
      // Get the invoice
      const invoice = await Invoice.findById(transaction.invoice);
      if (invoice) {
        // Find all other completed payments for this invoice
        const payments = await Transaction.find({
          invoice: invoice._id,
          _id: { $ne: transaction._id },
          type: 'Payment',
          status: 'Completed'
        });
        
        // Calculate total paid amount without this transaction
        const totalPaid = payments.reduce((sum, t) => sum + t.amount, 0);
        const totalInvoiceAmount = invoice.total;
        
        // Update invoice payment status
        let paymentStatus;
        if (totalPaid >= totalInvoiceAmount) {
          paymentStatus = 'Paid';
        } else if (totalPaid > 0) {
          paymentStatus = 'Partial';
        } else {
          paymentStatus = 'Unpaid';
        }
        
        await Invoice.findByIdAndUpdate(
          invoice._id,
          { paymentStatus }
        );
        
        // If the invoice status is being changed from 'Paid', update customer's totalSpent
        if (paymentStatus !== 'Paid' && invoice.paymentStatus === 'Paid') {
          await Customer.findByIdAndUpdate(
            invoice.customer,
            { $inc: { totalSpent: -invoice.total } }
          );
        }
      }
    }

    await Transaction.deleteOne({ _id: req.params.id });
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get transactions by customer
router.get('/customer/:customerId', async (req, res) => {
  try {
    const transactions = await Transaction.find({ customer: req.params.customerId })
      .populate('invoice', 'invoiceNumber')
      .sort({ date: -1 });
    
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get transactions by invoice
router.get('/invoice/:invoiceId', async (req, res) => {
  try {
    const transactions = await Transaction.find({ invoice: req.params.invoiceId })
      .populate('customer', 'name email')
      .sort({ date: -1 });
    
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;