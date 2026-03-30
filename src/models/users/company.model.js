const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const companySchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        address: {
            type: String,
        },
        code: {
            type: String,
        },
        phoneNumber: {
            type: String,
        },
        email: {
            type: String,
        },
        startDate: {
            type: Date,
        },
        expireDate: {
            type: Date,
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
companySchema.plugin(toJSON);
companySchema.plugin(paginate);

/**
 * @typedef User
 */
const Company = mongoose.model('Company', companySchema);

module.exports = Company;
