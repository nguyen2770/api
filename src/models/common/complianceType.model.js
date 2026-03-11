const mongoose = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const complianceTypeSchema = mongoose.Schema(
    {
        contractTypeId: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'ContractType',
            default: null,
        },
        complianceTypeName: {
            type: String,
            default: null,
            required: true,
        },
        complianceType: {
            type: Number,
            default: 0, // 0: Service Compliance, 1: Maintenance Compliance
            required: true,
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
complianceTypeSchema.plugin(toJSON);
complianceTypeSchema.plugin(paginate);

/**
 * @typedef User
 */
const ComplianceType = mongoose.model('ComplianceType', complianceTypeSchema);

module.exports = ComplianceType;
