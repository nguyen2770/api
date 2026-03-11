const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const schedulePreventiveSparePartSchema = new mongoose.Schema(
    {
        schedulePreventive: {
            type: SchemaTypes.ObjectId,
            ref: 'SchedulePreventive',
            default: null,
        },
        sparePart: {
            type: SchemaTypes.ObjectId,
            ref: 'SpareParts',
            default: null,
        },
        amc: {
            type: SchemaTypes.ObjectId,
            ref: 'Amc',
            default: null,
        },
        quantity: {
            type: Number,
        },
    },
    { timestamps: true }
);

// add plugin that converts mongoose to json
schedulePreventiveSparePartSchema.plugin(toJSON);
schedulePreventiveSparePartSchema.plugin(paginate);
const SchedulePreventiveSparePart = mongoose.model('SchedulePreventiveSparePart', schedulePreventiveSparePartSchema);

module.exports = SchedulePreventiveSparePart;
