const mongoose = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const contractTypeSchema = mongoose.Schema(
    {
        contractTypeName: {
            type: String,
            default: null,
            required: true,
        },
        contractType: {
            type: Number,
            default: 0, // 0: Service Contract, 1: Maintenance Contract
            required: true,
        },
        insurance: {
            type: Boolean,
            default: false,
        },
        mandatory: {
            type: Boolean,
            default: false,
        },
        stop_service: {
            type: Boolean,
            default: false,
        },
        verification: {
            type: Boolean,
            default: false,
        },
        expiryreneweddate: {
            type: Boolean,
            default: false,
        },
        createdBy: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'User',
            default: null,
        },
        updatedBy: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'User',
            default: null,
        },
        createdDate: {
            type: Date,
            default: Date.now,
        },
        updatedDate: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
contractTypeSchema.plugin(toJSON);
contractTypeSchema.plugin(paginate);

/**
 * @typedef User
 */
const ContractType = mongoose.model('ContractType', contractTypeSchema);

module.exports = ContractType;
