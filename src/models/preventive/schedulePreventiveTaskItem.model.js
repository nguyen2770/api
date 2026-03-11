const mongoose = require('mongoose');
const { SchemaTypes, Schema } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const schedulePreventiveTaskItemSchema = Schema(
    {
        breakdown: {
            type: SchemaTypes.ObjectId,
            ref: 'Breakdown',
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
        schedulePreventiveTask: {
            type: SchemaTypes.ObjectId,
            ref: 'SchedulePreventiveTask',
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
        // //checkin/out
        isProblem: {
            type: Boolean,
            default: false,
        },
        problemComment: {
            type: String,
            default: null,
        },
        comment: {
            type: String,
            default: null,
        },
        value: {
            type: String,
        },
        status: {
            type: String,
            num: ['done', 'not-done', 'yes', 'no', 'n/a'],
        },
        resource: {
            type: SchemaTypes.ObjectId,
            ref: 'Resource',
            default: null,
        },

    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
schedulePreventiveTaskItemSchema.plugin(toJSON);
schedulePreventiveTaskItemSchema.plugin(paginate);

/**
 * @typedef Service
 */
const SchedulePreventiveTaskItem = mongoose.model('SchedulePreventiveTaskItem', schedulePreventiveTaskItemSchema);

module.exports = SchedulePreventiveTaskItem;
