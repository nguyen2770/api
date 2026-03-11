const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const repairContractSchema = mongoose.Schema(
    {
        customer: {
            type: SchemaTypes.ObjectId,
            ref: 'Customer',
        },
        serviceContractor: {
            type: SchemaTypes.ObjectId,
            ref: 'ServiceContractor',
            required: true,
        },
        contractNo: {
            type: String,
        },
        contractName: {
            type: String,
        },
        // ngày có hiệu lực
        effectiveDate: {
            type: Date,
        },
        // ngày hết hạn
        expirationDate: {
            type: Date,
        },
        // mgayf ký
        signedDate: {
            type: Date,
        },
        status: {
            type: Boolean,
            default: true,
            required: true,
        },
        state: {
            type: String,
            required: true,
            enum: ['new'],
            default: 'new',
        },
        isCalloutRestirction: {
            type: Boolean,
        },
        isSparepartCharge: {
            type: Boolean,
        },
        // số lần sửa chữa
        numberOfRepairs: {
            type: Number,
        },
        totalCost: {
            type: Number,
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

// add plugin that converts mongoose to json
repairContractSchema.plugin(toJSON);
repairContractSchema.plugin(paginate);

/**
 * @typedef User
 */
const RepairContract = mongoose.model('RepairContract', repairContractSchema);

module.exports = RepairContract;
