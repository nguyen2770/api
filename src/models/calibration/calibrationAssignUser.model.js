const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const calibrationAssignUserSchema = new mongoose.Schema(
    {
        calibration: {
            type: SchemaTypes.ObjectId,
            ref: 'Preventive',
            default: null,
        },
        user: {
            type: SchemaTypes.ObjectId,
            ref: 'User',
            default: null,
        },
    },
    { timestamps: true }
);

// add plugin that converts mongoose to json
calibrationAssignUserSchema.plugin(toJSON);
calibrationAssignUserSchema.plugin(paginate);
const CalibrationAssignUser = mongoose.model('CalibrationAssignUser', calibrationAssignUserSchema);

module.exports = CalibrationAssignUser;
