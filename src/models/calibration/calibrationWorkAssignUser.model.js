const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const calibrationWorkAssignUserSchema = new mongoose.Schema(
    {
        calibrationWork: {
            type: SchemaTypes.ObjectId,
            ref: 'CalibrationWork',
            default: null,
        },
        // calibration: {
        //     type: SchemaTypes.ObjectId,
        //     ref: 'Calibration',
        //     default: null,
        // },
        user: {
            type: SchemaTypes.ObjectId,
            ref: 'User',
            default: null,
        },
        confirmDate: {
            type: Date,
            default: null,
        },
        cancelConfirmDate: {
            type: Date,
            default: null,
        },
        status: {
            type: String,
            default: 'assigned',
            enum: [
                'assigned',
                'accepted',
                'replacement',
                'inProgress',
                'cancelled',
                'reassignment',
                'completed',
                'partiallyCompleted',
                'completeRecalibrationIssue',
            ], // partiallyCompleted hoàn thành 1 phần khi tạo sự cố
        },
        refusalDate: {
            type: Date,
            default: null,
        },
        reasonsForRefusal: {
            type: String,
        },
        signature: {
            type: String,
        },
        completionDate: {
            type: Date,
        },
        // lý do mở lại
        reasonForReopening: {
            type: String,
        },
    },
    { timestamps: true }
);

// add plugin that converts mongoose to json
calibrationWorkAssignUserSchema.plugin(toJSON);
calibrationWorkAssignUserSchema.plugin(paginate);
const CalibrationWorkAssignUser = mongoose.model('CalibrationWorkAssignUser', calibrationWorkAssignUserSchema);

module.exports = CalibrationWorkAssignUser;
