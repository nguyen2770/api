const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const customerContractSchema = mongoose.Schema(
    {
        contractName: {
            type: String,
            required: true,
            trim: true,
        },
        reminderEsclationId: {
            type: SchemaTypes.ObjectId,
            default: null,
            // ref: '',
        },
        customerId: {
            type: SchemaTypes.ObjectId,
            default: null,
            ref: 'Customer',
        },
        contractTypeId: {
            type: SchemaTypes.ObjectId,
            default: null,
            ref: 'ContractType',
        },
        resourceContractId: {
            type: SchemaTypes.ObjectId,
            default: null,
            ref: 'Resource',
        },
        resourceInsurancetId: {
            type: SchemaTypes.ObjectId,
            default: null,
            ref: 'Resource',
        },
        contractStratDate: {
            type: Date,
            default: null,
        },
        contractEndDate: {
            type: Date,
            default: null,
        },
        policy: {
            type: String,
            default: null,
        },
        policyProducer: {
            type: String,
            default: null,
        },
        policyPhoneNumber: {
            type: String,
            default: null,
        },
        policycheck: {
            type: Boolean,
            default: true,
        },
        insuranceEffectiveDate: {
            type: Date,
            default: null,
        },
        insuranceExpirationDate: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
customerContractSchema.plugin(toJSON);
customerContractSchema.plugin(paginate);

/**
 * @typedef User
 */
const CustomerContractSchema = mongoose.model('CustomerContractSchema', customerContractSchema);

module.exports = CustomerContractSchema;
