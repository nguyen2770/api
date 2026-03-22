const mongoose = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const returnToSupplierSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    trim: true,
  },
  returnDate: {
    type: Date,
    required: true,
  },
  supplier: {
    type: String, 
    required: true,
    trim: true,
  },
  action: {
    type: String,
    enum: ['pendingApproval', 'approved', 'rejected'],
    default: "pendingApproval",   
  },
  phoneNumber: {
    type: String,
    trim: true,
  },
  address: {
    type: String,
    trim: true,
  },
  purchaseOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PurchaseOrder',
    default: null,
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    default: null,
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    default: null,
  },
  comment: {
    type: String,
  },
  description: {
    type: String,
    trim: true,
  },
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
}, {
  timestamps: true,
});

returnToSupplierSchema.plugin(toJSON);
returnToSupplierSchema.plugin(paginate);

module.exports = mongoose.model('ReturnToSupplier', returnToSupplierSchema);
