const mongoose = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const stockIssueDetailSchema = new mongoose.Schema({
    stockIssue: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StockIssue',
        required: true
    },
    itemType: {
        type: String,
        enum: ['SpareParts', 'AssetModel'],
        required: true
    },
    uomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Uom',
    },
    item: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'itemType',
    },
    qty:
    {
        type: Number,
        required: true,
    },
    unitPrice:
    {
        type: Number,
        required: true,
    },
    vatPercent:
    {
        type: Number,
        default: 0,
    },
    note:
    {
        type: String
    },
    createdBy:
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    updatedBy:
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
},
    {
        timestamps: true
    });


stockIssueDetailSchema.plugin(paginate);
stockIssueDetailSchema.plugin(toJSON);

module.exports = mongoose.model('StockIssueDetail', stockIssueDetailSchema);
