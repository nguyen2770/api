const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const calibrationWorkCheckinCheckOutSchema = new mongoose.Schema(
    {
        calibrationWork: {
            type: SchemaTypes.ObjectId,
            ref: 'CalibrationWork',
            default: null,
        },
        calibration: {
            type: SchemaTypes.ObjectId,
            ref: 'Calibration',
            default: null,
        },
        calibrationWorkAssignUser: {
            type: SchemaTypes.ObjectId,
            ref: 'CalibrationWorkAssignUser',
            default: null,
        },
        calibrationWorkHistory: {
            type: SchemaTypes.ObjectId,
            ref: 'CalibrationWorkHistory',
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
            type: String,
        },
        checkOutDateTime: { type: Date, default: null },
    },
    { timestamps: true }
);

// add plugin that converts mongoose to json
calibrationWorkCheckinCheckOutSchema.plugin(toJSON);
calibrationWorkCheckinCheckOutSchema.plugin(paginate);
const CalibrationWorkCheckinCheckOut = mongoose.model(
    'CalibrationWorkCheckinCheckOut',
    calibrationWorkCheckinCheckOutSchema
);

module.exports = CalibrationWorkCheckinCheckOut;
