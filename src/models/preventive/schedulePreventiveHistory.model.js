 const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const schedulePreventiveHistorySchema = new mongoose.Schema(
    {
        schedulePreventive: {
            type: SchemaTypes.ObjectId,
            ref: 'SchedulePreventive',
            default: null,
        },
        schedulePreventiveTask: {
            type: SchemaTypes.ObjectId,
            ref: 'SchedulePreventiveTask',
            default: null,
        },
        comments: {
            type: String,
        },
        oldStatus: {
            type: String,
        },
        status: {
            type: String,
        },
        assignedTo: {
            type: SchemaTypes.ObjectId,
            ref: 'User',
            default: null,
        },
        createdBy: {
            type: SchemaTypes.ObjectId,
            ref: 'User',
            default: null,
        },

    },
    { timestamps: true }
);

// add plugin that converts mongoose to json
schedulePreventiveHistorySchema.plugin(toJSON);
schedulePreventiveHistorySchema.plugin(paginate);
const SchedulePreventiveHistory = mongoose.model('SchedulePreventiveHistory', schedulePreventiveHistorySchema);

module.exports = SchedulePreventiveHistory;
