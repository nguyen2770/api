const mongoose = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const { SchemaTypes } = mongoose;


const requestPurchaseDetailSchema = mongoose.Schema(
  {
    requestPurchase: {
      type: SchemaTypes.ObjectId,
      ref: 'RequestPurchase',
      required: true,
    },
    itemType: {
      type: String,
      enum: ['SpareParts', 'AssetModel'],
      required: true,
    },
    sparePart: {
      type: SchemaTypes.ObjectId,
      ref: 'SpareParts',
      default: null,
    },
    asset: {
      type: SchemaTypes.ObjectId,
      ref: 'Asset',
      default: null,
    },
    assetTypeCategory: {
      type: SchemaTypes.ObjectId,
      ref: 'AssetTypeCategory',
      default: null,
    },
    manufacturer: {
      type: SchemaTypes.ObjectId,
      ref: 'Manufacturer',
      default: null,
    },
    assetModel: {
      type: SchemaTypes.ObjectId,
      ref: 'AssetModel',
      default: null,
    },
    qty: {
      type: Number,
      required: true,
    },
    unitPrice: {
      type: Number,
      default: 0,
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
    uom: {
      type: SchemaTypes.ObjectId,
      ref: 'Uom',
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

requestPurchaseDetailSchema.plugin(paginate);
requestPurchaseDetailSchema.plugin(toJSON);

const RequestPurchaseDetail = mongoose.model('RequestPurchaseDetail', requestPurchaseDetailSchema);
module.exports = RequestPurchaseDetail;
