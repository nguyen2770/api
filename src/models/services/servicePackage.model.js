const mongoose = require('mongoose');
const { SchemaTypes, Schema } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const servicePackageSchema = Schema(
    {
        servicePackageName: {
            type: String,
            required: true,
            trim: true,
        },
        servicePackageType: {
            type: String,
            required: true,
            enum: ['amc', 'warranty', 'short_term'],
        },
        servicePackageCode: {
            type: String,
            default: null,
        },
        durationValue: {
            type: Number,
            default: 0,
            required: true
        },
        durationType: {
            type: String,
            required: true,
            enum: ['day', 'month', 'year'],
        },
        costLimit: {
            type: Number
        },
        isCostLimit: {
            type: Boolean,
        },
        isSparepartCharge: {
            type: Boolean,
        },
        status: {
            type: Boolean,
            default: true,
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
        }
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
servicePackageSchema.plugin(toJSON);
servicePackageSchema.plugin(paginate);


/**
 * @typedef ServicePackage
 */
const ServicePackage = mongoose.model('ServicePackage', servicePackageSchema);

module.exports = ServicePackage;
