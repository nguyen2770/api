const mongoose = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const returnToSupplierDetailSchema = new mongoose.Schema({
  returnToSupplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ReturnToSupplier',
    required: true,
  },
  purchaseOrderDetail: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PurchaseOrderDetail',
    default: null,
  },
  itemType: {
    type: String,
    enum: ['SpareParts', 'AssetModel'],
    required: true,
  },
  item: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'itemType',
    required: true,
  },
  qty: {
    type: Number,
    required: true,
  },
  unitPrice: {
    type: Number,
    required: true,
  },
  vatPercent: {
    type: Number,
    default: 0,
  },
  reason: {
    type: String,
    trim: true,
  },
  note: {
    type: String,
    trim: true,
  },
  uom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Uom',
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

returnToSupplierDetailSchema.plugin(toJSON);
returnToSupplierDetailSchema.plugin(paginate);

module.exports = mongoose.model('ReturnToSupplierDetail', returnToSupplierDetailSchema);
