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
            type: String,
        },
        expireDate: {
            type: Date,
        },
        port: {
            type: String,
        },
        dataBase: {
            type: String,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        taxIdentificationNumber: {
            type: String,
        },
        website: {
            type: String,
        },
        representative: {
            type: String,
        },
        representativePhone: { type: String },
        databaseUrl: {
            type: String,
        },
        baseUrl: {
            type: String,
        },
        businessType: {
            type: String,
        },
        installName: {
            type: String,
        },
        identifierCode: {
            type: String,
        },
        manufacturingCompany: {
            type: String,
            enum: ['pnp', 'mtc'],
        },
        loginBeforeStartingWork: {
            type: Boolean,
            default: false,
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
