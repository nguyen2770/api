const mongoose = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const { SchemaTypes } = mongoose;

const quotationSchema = mongoose.Schema(
  {
    code: {
      type: String,
    },
    requestPurchase: {
      type: SchemaTypes.ObjectId,
      ref: 'RequestPurchase',
    },
    supplier: {
      type: String,
      // required: true,
    },
    contactPhone: {
      type: String,
      default: null,
    },
    contactAddress: {
      type: String,
      default: null,
    },
    email: {
      type: String,
      default: null,
    },
    quotationDate: {
      type: Date,
      // required: true,
    },
    resource: [{
      type: SchemaTypes.ObjectId,
      ref: "Resource",
      default: null,
    }],
    note: {
      type: String,
      default: null,
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

quotationSchema.plugin(paginate);
quotationSchema.plugin(toJSON);

module.exports = mongoose.model('Quotation', quotationSchema);
