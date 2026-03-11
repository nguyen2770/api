const mongoose = require('mongoose');
const { SchemaTypes, Schema } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const schedulePreventiveDocumentsSchema = Schema(
    {
        schedulePreventive: {
            type: SchemaTypes.ObjectId,
            ref: 'SchedulePreventive',
            default: null,
        },
        resource: {
            type: SchemaTypes.ObjectId,
            ref: 'Resource',
            default: null,
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
schedulePreventiveDocumentsSchema.plugin(toJSON);
schedulePreventiveDocumentsSchema.plugin(paginate);

/**
 * @typedef Service
 */
const SchedulePreventiveDocuments = mongoose.model(
    'SchedulePreventiveDocuments',
    schedulePreventiveDocumentsSchema
);

module.exports = SchedulePreventiveDocuments;
