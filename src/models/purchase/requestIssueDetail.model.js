const mongoose = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const { SchemaTypes } = mongoose;


const requestIssueDetailSchema = mongoose.Schema(
  {
    requestIssue: {
      type: SchemaTypes.ObjectId,
      ref: 'RequestIssue',
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
   
    note: {
      type: String,
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

requestIssueDetailSchema.plugin(paginate);
requestIssueDetailSchema.plugin(toJSON);

const RequestIssueDetail = mongoose.model('RequestIssueDetail', requestIssueDetailSchema);
module.exports = RequestIssueDetail;
