const mongoose = require('mongoose');
const { SchemaTypes, Schema } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const serviceSchema = Schema(
    {
        serviceName: {
            type: String,
            required: true,
            trim: true,
        },
        servicePriority: {
            type: String,
            required: true,
            enum: ['high', 'medium', 'low'],
        },
        serviceType: {
            type: SchemaTypes.ObjectId,
            ref: 'ServiceType',
            default: null,
        },
        status: {
            type: Boolean,
            default: true,
            required: true
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
serviceSchema.plugin(toJSON);
serviceSchema.plugin(paginate);


/**
 * @typedef Service
 */
const Service = mongoose.model('Service', serviceSchema);

module.exports = Service;
