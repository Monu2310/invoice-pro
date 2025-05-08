const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  status: {
    type: String,
    enum: ['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled', 'Partially Paid'],
    default: 'Draft'
  },
  invoiceDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  items: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    tax: {
      type: Number,
      default: 0
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  taxTotal: {
    type: Number,
    default: 0,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  notes: {
    type: String,
    trim: true
  },
  terms: {
    type: String,
    trim: true
  },
  billingAddress: {
    street: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    zip: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      trim: true
    }
  },
  shippingAddress: {
    street: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    zip: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      trim: true
    }
  },
  paymentDetails: [{
    method: {
      type: String,
      enum: ['Cash', 'Bank Transfer', 'Credit Card', 'Debit Card', 'UPI', 'PayPal', 'Check', 'Other'],
      required: true,
      trim: true
    },
    transactionId: {
      type: String,
      trim: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    notes: {
      type: String,
      trim: true
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook to update the updatedAt field
invoiceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Calculate total payments
invoiceSchema.virtual('totalPaid').get(function() {
  return this.paymentDetails.reduce((sum, payment) => sum + payment.amount, 0);
});

// Calculate amount due
invoiceSchema.virtual('amountDue').get(function() {
  return this.total - this.totalPaid;
});

// Calculate if invoice is overdue
invoiceSchema.virtual('isOverdue').get(function() {
  return this.dueDate < new Date() && this.amountDue > 0;
});

// Make virtuals available when converting to JSON
invoiceSchema.set('toJSON', { virtuals: true });
invoiceSchema.set('toObject', { virtuals: true });

// Update status based on payment information
invoiceSchema.pre('save', function(next) {
  const totalPaid = this.paymentDetails.reduce((sum, payment) => sum + payment.amount, 0);
  
  if (totalPaid === 0 && this.status !== 'Draft' && this.status !== 'Cancelled') {
    if (this.dueDate < new Date()) {
      this.status = 'Overdue';
    } else {
      this.status = 'Sent';
    }
  } else if (totalPaid > 0 && totalPaid < this.total) {
    this.status = 'Partially Paid';
  } else if (totalPaid >= this.total) {
    this.status = 'Paid';
  }
  
  next();
});

module.exports = mongoose.model('Invoice', invoiceSchema);