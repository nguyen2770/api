const mongoose = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const { SchemaTypes } = mongoose;


const purchaseOrdersDetailSchema = mongoose.Schema(
  {
    purchaseOrder: {
      type: SchemaTypes.ObjectId,
      ref: 'PurchaseOrder',
      required: true,
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
    purchaseRequestDetail: {
      type: SchemaTypes.ObjectId,
      ref: 'RequestPurchaseDetail',
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

purchaseOrdersDetailSchema.plugin(paginate);
purchaseOrdersDetailSchema.plugin(toJSON);

const PurchaseOrderDetail = mongoose.model('PurchaseOrderDetail', purchaseOrdersDetailSchema);
module.exports = PurchaseOrderDetail;
