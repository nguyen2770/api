const mongoose = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const receiptIssueDetailSchema = new mongoose.Schema({
    receiptIssue: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ReceiptIssue',
        required: true
    },
    requestIssueDetail: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RequestIssueDetail',
    },
    itemType: {
        type: String,
        enum: ['SpareParts', 'AssetModel'],
        required: true
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


receiptIssueDetailSchema.plugin(paginate);
receiptIssueDetailSchema.plugin(toJSON);

module.exports = mongoose.model('ReceiptIssueDetail', receiptIssueDetailSchema);
