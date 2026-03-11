const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const schedulePreventiveCheckInCheckOutSchema = new mongoose.Schema(
    {
        schedulePreventiveTask: {
            type: SchemaTypes.ObjectId,
            ref: 'SchedulePreventiveTask',
            default: null,
        },
        user: {
            type: SchemaTypes.ObjectId,
            ref: 'User',
        },
        checkInDateTime: {
            type: Date,
            default: null,
        },
        comment: {
            type: String
        },
        checkOutDateTime: { type: Date, default: null },
    },
    { timestamps: true }
);

// add plugin that converts mongoose to json
schedulePreventiveCheckInCheckOutSchema.plugin(toJSON);
schedulePreventiveCheckInCheckOutSchema.plugin(paginate);
const SchedulePreventiveCheckInCheckOut = mongoose.model(
    'SchedulePreventiveCheckInCheckOut',
    schedulePreventiveCheckInCheckOutSchema
);

module.exports = SchedulePreventiveCheckInCheckOut;
