const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const suppliesNeedSchema = mongoose.Schema(
    {
        name: {
            type: String,
        },
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
        state: {
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
    },
    {
        timestamps: true,
    }
);

suppliesNeedSchema.plugin(paginate);
suppliesNeedSchema.plugin(toJSON);


/**
 * @typedef User
 */
const SuppliesNeed = mongoose.model('SuppliesNeed', suppliesNeedSchema);

module.exports = SuppliesNeed;
