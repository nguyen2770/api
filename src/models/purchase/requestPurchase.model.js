const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const requestPurchaseSchema = mongoose.Schema(
    {

        code: {
            type: String,
        },
        branch: {
            type: SchemaTypes.ObjectId,
            ref: 'Branch',
            default: null,
        },
        department: {
            type: SchemaTypes.ObjectId,
            ref: 'Department',
            default: null,
        },
        description: {
            type: String,
        },
        supplier: {
            type: String,
        },
        action: {
            type: String,
            enum: ['pendingApproval', 'approved', 'rejected'],
            default: "pendingApproval",
        },
        comment: {
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
        isDone: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json

requestPurchaseSchema.plugin(paginate);
requestPurchaseSchema.plugin(toJSON);


/**
 * @typedef User
 */
const requestPurchase = mongoose.model('RequestPurchase', requestPurchaseSchema);

module.exports = requestPurchase;
