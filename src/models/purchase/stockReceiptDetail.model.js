const mongoose = require('mongoose');
const { toJSON, paginate } = require('../plugins');
const PurchaseOrderDetail = require('./purchaseOrdersDetail.model');

const { SchemaTypes } = mongoose;


const StockReceiptDetailSchema = mongoose.Schema(
  {
    stockReceipt: {
      type: SchemaTypes.ObjectId,
      ref: 'StockReceipt',
      required: true,
    },
    itemType: {
      type: String,
      enum: ['SpareParts', 'AssetModel'],
    },
    item: {
      type: SchemaTypes.ObjectId,
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
    supplier: {
      type: String,
    },
    needDate: {
      type: Date,
    },
    usagePurpose: {
      type: String,
    },
    note: {
      type: String,
    },
    uomId: {
      type: SchemaTypes.ObjectId,
      ref: 'Uom',
    },
    purchaseOrderDetail: {
      type: SchemaTypes.ObjectId,
      ref: 'PurchaseOrderDetail',
    },
    productionDate: {
      type: Date,
    },
    createdBy: {
      type: SchemaTypes.ObjectId,
      ref: 'User',
      default: null,
    },
    updatedBy: {
      type: SchemaTypes.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

StockReceiptDetailSchema.plugin(paginate);
StockReceiptDetailSchema.plugin(toJSON);

const StockReceiptDetail = mongoose.model('StockReceiptDetail', StockReceiptDetailSchema);
module.exports = StockReceiptDetail;
