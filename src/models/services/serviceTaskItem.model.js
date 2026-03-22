const mongoose = require('mongoose');
const { SchemaTypes, Schema } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const serviceTaskItemSchema = Schema(
    {
        taskItemDescription: {
            type: String,
        },
        answerTypeInspection: {
            type: String,
            enum: ['yes/no/na', 'value', 'numberic-value'],
        },
        condition: {
            type: String,
            enum: ['greater-than-or-equal', 'less-than-or-equal', 'on', 'rang'],
        },
        value1: {
            type: Number,
            trim: true,
        },
        value2: {
            type: Number,
            trim: true,
        },
        commentTicket: {
            type: String,
        },
        commentNotification: {
            type: String,
        },
        serviceTask: {
            type: SchemaTypes.ObjectId,
            ref: 'ServiceTask',
            default: null,
        },
        service: {
            type: SchemaTypes.ObjectId,
            ref: 'Service',
            default: null,
        },
        uom: {
            type: SchemaTypes.ObjectId,
            ref: 'Uom',
            default: null,
        },
        monitoringPoints: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
serviceTaskItemSchema.plugin(toJSON);
serviceTaskItemSchema.plugin(paginate);


/**
 * @typedef Service
 */
const ServiceTaskItem = mongoose.model('ServiceTaskItem', serviceTaskItemSchema);

module.exports = ServiceTaskItem;
