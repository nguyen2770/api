const mongoose = require('mongoose');
const { SchemaTypes, Schema } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const preventiveTaskItemSchema = Schema(
    {
        preventiveOfModel: {
            type: SchemaTypes.ObjectId,
            ref: 'PreventiveOfModel',
            default: null,
        },
        taskDescription: {
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
        taskItemDescription: {
            type: String,
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
        preventiveTask: {
            type: SchemaTypes.ObjectId,
            ref: 'PreventiveTask',
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
preventiveTaskItemSchema.plugin(toJSON);
preventiveTaskItemSchema.plugin(paginate);

/**
 * @typedef Service
 */
const PreventiveTaskItem = mongoose.model('PreventiveTaskItem', preventiveTaskItemSchema);

module.exports = PreventiveTaskItem;
