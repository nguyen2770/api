const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const schedulePreventiveConditionBasedSchema = new mongoose.Schema(
    {
        preventive: {
            type: SchemaTypes.ObjectId,
            ref: 'Preventive',
            default: null,
        },
        schedulePreventive: {
            type: SchemaTypes.ObjectId,
            ref: 'SchedulePreventive',
            default: null,
        },
        condition: {
            type: String,
        },
        uom: {
            type: SchemaTypes.ObjectId,
            ref: 'Uom',
            default: null,
        },
        value: {
            type: Number,
        },
        note: {
            type: String,
        },
    },
    { timestamps: true }
);

// add plugin that converts mongoose to json
schedulePreventiveConditionBasedSchema.plugin(toJSON);
schedulePreventiveConditionBasedSchema.plugin(paginate);
const SchedulePreventiveConditionBased = mongoose.model(
    'SchedulePreventiveConditionBased',
    schedulePreventiveConditionBasedSchema
);

module.exports = SchedulePreventiveConditionBased;
