const mongoose = require('mongoose');
const { SchemaTypes, Schema } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const servicePackageServiceTaskSchema = Schema(
    {
        servicePackage: {
            type: SchemaTypes.ObjectId,
            ref: 'ServicePackage',
            default: null,
        },
        servicePackageService: {
            type: SchemaTypes.ObjectId,
            ref: 'ServicePackageService',
            default: null,
        },
        serviceTask: {
            type: SchemaTypes.ObjectId,
            ref: 'ServiceTask',
            default: null,
        },
        totalPrice: {
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
servicePackageServiceTaskSchema.plugin(toJSON);
servicePackageServiceTaskSchema.plugin(paginate);


/**
 * @typedef ServicePackageServiceTask
 */
const ServicePackageServiceTask = mongoose.model('ServicePackageServiceTask', servicePackageServiceTaskSchema);

module.exports = ServicePackageServiceTask;
