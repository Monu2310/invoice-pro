const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Customer = require('../models/Customer');

// Get all orders
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('customer', 'name email')
      .sort({ orderDate: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single order
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new order
router.post('/', async (req, res) => {
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
  
  const order = new Order({
    ...req.body,
    subtotal,
    tax,
    total
  });

  try {
    // Validate customer exists
    const customerExists = await Customer.findById(req.body.customer);
    if (!customerExists) {
      return res.status(400).json({ message: 'Customer not found' });
    }

    const newOrder = await order.save();
    res.status(201).json(newOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update order
router.patch('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Update order fields
    Object.keys(req.body).forEach(key => {
      order[key] = req.body[key];
    });
    
    // Recalculate totals if items changed
    if (req.body.items) {
      let subtotal = 0;
      if (Array.isArray(req.body.items)) {
        subtotal = req.body.items.reduce((sum, item) => {
          return sum + (item.price * item.quantity);
        }, 0);
      }
      
      const taxRate = req.body.taxRate !== undefined ? req.body.taxRate : (order.tax / order.subtotal * 100);
      const tax = subtotal * (taxRate / 100);
      const total = subtotal + tax;
      
      order.subtotal = subtotal;
      order.tax = tax;
      order.total = total;
    }

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete order
router.delete('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    await Order.deleteOne({ _id: req.params.id });
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get orders by status
router.get('/status/:status', async (req, res) => {
  try {
    const orders = await Order.find({ status: req.params.status })
      .populate('customer', 'name email')
      .sort({ orderDate: -1 });
    
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get customer's orders
router.get('/customer/:customerId', async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.params.customerId })
      .sort({ orderDate: -1 });
    
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;