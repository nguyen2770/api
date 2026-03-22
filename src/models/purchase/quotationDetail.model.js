const mongoose = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const { SchemaTypes } = mongoose;

const quotationDetailSchema = mongoose.Schema(
  {
    quotation: {
      type: SchemaTypes.ObjectId,
      ref: 'Quotation',
      required: true,
    },
    requestPurchaseDetail: {
      type: SchemaTypes.ObjectId,
      ref: 'RequestPurchaseDetail',
    },
    itemType: {
      type: String,
      enum: ['SpareParts', 'AssetModel'],
      required: true,
    },
    item: {
      type: SchemaTypes.ObjectId,
      required: true,
      refPath: 'itemType',
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
    deliveryTime: Date,
    note: String,
    supplier: {
      type: String,
    },
    uom: {
      type: SchemaTypes.ObjectId,
      ref: 'Uom',
    },
    createdBy: {
      type: SchemaTypes.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: SchemaTypes.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

quotationDetailSchema.plugin(paginate);
quotationDetailSchema.plugin(toJSON);

module.exports = mongoose.model('QuotationDetail', quotationDetailSchema);
