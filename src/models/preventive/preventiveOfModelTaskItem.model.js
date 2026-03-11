const mongoose = require('mongoose');
const { SchemaTypes, Schema } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const preventiveOfModelTaskItemSchema = Schema(
    {
        preventiveOfModelTask: {
            type: SchemaTypes.ObjectId,
            ref: 'PreventiveOfModelTask',
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
preventiveOfModelTaskItemSchema.plugin(toJSON);
preventiveOfModelTaskItemSchema.plugin(paginate);

/**
 * @typedef Service
 */
const PreventiveOfModelTaskItem = mongoose.model('PreventiveOfModelTaskItem', preventiveOfModelTaskItemSchema);

module.exports = PreventiveOfModelTaskItem;
