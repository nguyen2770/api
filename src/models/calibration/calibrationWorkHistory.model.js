const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const calibrationWorkHistorySchema = new mongoose.Schema(
    {
        // lưu lại các lịch sử báo cáo lên
        calibrationWork: {
            type: SchemaTypes.ObjectId,
            ref: 'CalibrationWork',
            default: null,
        },
        calibrationWorkAssignUser: {
            type: SchemaTypes.ObjectId,
            ref: 'CalibrationWorkAssignUser',
            default: null,
        },
        createdBy: {
            type: SchemaTypes.ObjectId,
            ref: 'User',
            default: null,
        },
        isPassed: {
            type: Boolean,
        },
        comment: {
            type: String,
        },
        signature: {
            type: String,
        },
        downtimeHr: {
            type: Number,
            default: 0,
        },
        downtimeMin: {
            type: Number,
            default: 0,
        },
        breakdown: {
            type: SchemaTypes.ObjectId,
            ref: 'Breakdown',
            default: null,
        },
    },
    { timestamps: true }
);

// add plugin that converts mongoose to json
calibrationWorkHistorySchema.plugin(toJSON);
calibrationWorkHistorySchema.plugin(paginate);
const CalibrationWorkHistory = mongoose.model('CalibrationWorkHistory', calibrationWorkHistorySchema);

module.exports = CalibrationWorkHistory;
