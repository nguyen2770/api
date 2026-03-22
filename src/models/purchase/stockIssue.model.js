const mongoose = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const stockIssueSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
    },
    contractNumber: {
        type: String,
        trim: true
    },
    issueDate: {
        type: Date,
        required: true
    },
    locationSrc: { // kho lấy hàng
        type: mongoose.Schema.Types.ObjectId,
        ref: "StockLocation"
    },
    branch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department'
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer"
    },
    receiverUsers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    description: {
        type: String
    },

    action: {
        type: String,
        enum: ['pendingApproval', 'approved', 'rejected'],
        default: "pendingApproval",
    },
    exportType: {
        type: String,
        enum: ['DISPOSAL', 'USAGE'],
    },
    comment: {
        type: String,
    },
    issuedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

stockIssueSchema.plugin(paginate);
stockIssueSchema.plugin(toJSON);


module.exports = mongoose.model('StockIssue', stockIssueSchema);
