const mongoose = require('mongoose');
const { SchemaTypes, Schema } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const servicePackageServiceSchema = Schema(
    {
        service: {
            type: SchemaTypes.ObjectId,
            ref: 'Service',
            default: null,
        },
        servicePackage: {
            type: SchemaTypes.ObjectId,
            ref: 'ServicePackage',
            default: null,
        },
        frequencyNumber: {
            type: Number
        },
        noOfAsset: {
            type: Number
        },
        sortIndex: {
            type: Number
        }
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
servicePackageServiceSchema.plugin(toJSON);
servicePackageServiceSchema.plugin(paginate);


/**
 * @typedef ServicePackageService
 */
const ServicePackageService = mongoose.model('ServicePackageService', servicePackageServiceSchema);

module.exports = ServicePackageService;
