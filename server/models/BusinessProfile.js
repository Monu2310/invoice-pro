const mongoose = require('mongoose');

const businessProfileSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  logo: {
    type: String,
    trim: true
  },
  taxIdentification: {
    gstin: {
      type: String,
      trim: true
    },
    pan: {
      type: String,
      trim: true
    }
  },
  bankDetails: {
    accountName: {
      type: String,
      trim: true
    },
    accountNumber: {
      type: String,
      trim: true
    },
    bankName: {
      type: String,
      trim: true
    },
    ifscCode: {
      type: String,
      trim: true
    },
    branchName: {
      type: String,
      trim: true
    }
  },
  invoiceSettings: {
    prefix: {
      type: String,
      default: 'INV',
      trim: true
    },
    nextNumber: {
      type: Number,
      default: 1001,
      min: 1
    },
    termsAndConditions: {
      type: String,
      trim: true
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('BusinessProfile', businessProfileSchema);