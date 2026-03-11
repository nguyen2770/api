const mongoose = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const { SchemaTypes } = mongoose;

const quotationAttachmentSchema = mongoose.Schema(
  {
    quotation: {
      type: SchemaTypes.ObjectId,
      ref: 'Quotation',
      required: true,
    },
    resourceType: {
        type: String,
    },
    resourceId: {
      type: SchemaTypes.ObjectId,
      ref: "Resource",
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

quotationAttachmentSchema.plugin(paginate);
quotationAttachmentSchema.plugin(toJSON);

module.exports = mongoose.model('QuotationAttachments', quotationAttachmentSchema);
