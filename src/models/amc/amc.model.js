const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const amcSchema = mongoose.Schema(
    {
        customer: {
            type: SchemaTypes.ObjectId,
            ref: 'Customer',
        },
        servicePackage: {
            type: SchemaTypes.ObjectId,
            ref: 'ServicePackage',
        },
        serviceContractor: {
            type: SchemaTypes.ObjectId,
            ref: 'ServiceContractor',
            required: true,
        },
        requestDate: {
            type: Date,
            required: true,
        },
        signedDate: {
            type: Date,
        },
        status: {
            type: Boolean,
            default: true,
            required: true,
        },
        amcNo: {
            type: String,
        },
        state: {
            type: String,
            required: true,
            enum: ['new'],
            default: 'new',
        },
        calloutRestirctionNo: {
            type: Number,
        },
        isCalloutRestirction: {
            type: Boolean,
        },
        isSparepartCharge: {
            type: Boolean,
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
amcSchema.plugin(toJSON);
amcSchema.plugin(paginate);

/**
 * @typedef User
 */
const Amc = mongoose.model('Amc', amcSchema);

module.exports = Amc;
