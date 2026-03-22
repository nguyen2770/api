const mongoose = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const receiptIssueSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
  },
  contractNumber: {
        type: String,
        trim: true
  },
  issueDate: {
    type: Date,
    required: true
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  requestIssue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RequestIssue'
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer"
  },
  description: {
    type: String
  },
  action: {
    type: String,
    enum: ['pendingApproval', 'approved', 'rejected'],
    default: "pendingApproval",   
  },
  comment: {
    type: String,
  },
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

receiptIssueSchema.plugin(paginate);
receiptIssueSchema.plugin(toJSON);


module.exports = mongoose.model('ReceiptIssue', receiptIssueSchema);
