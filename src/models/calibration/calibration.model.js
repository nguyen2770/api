const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const calibrationSchema = new mongoose.Schema(
    {
        calibrationName: {
            type: String,
            required: true,
        },
        assetMaintenance: {
            type: SchemaTypes.ObjectId,
            ref: 'AssetMaintenance',
            default: null,
            required: true,
        },
        calibrationContract: {
            type: SchemaTypes.ObjectId,
            ref: 'CalibrationContract',
            default: null,
        },
        code: {
            type: String,
        },
        isStart: {
            type: Boolean,
            default: false,
        },
        status: {
            type: String,
            default: 'new',
            enum: ['new', 'started', 'stoped'],
        },
        startDate: {
            type: Date,
        },
        endDate: {
            type: Date,
        },
        // cánh bao nhiêu
        numberNext: {
            type: Number,
            required: true,
        },
        // kiểu dữ liệu
        dateType: {
            type: String,
            enum: ['days', 'weeks', 'months', 'years'],
            required: true,
        },
        importance: {
            type: String,
            enum: ['Low', 'Medium', 'High'],
        },
        createdBy: {
            type: SchemaTypes.ObjectId,
            ref: 'User',
            default: null,
        },
        updatedBy: {
            type: SchemaTypes.ObjectId,
            ref: 'User',
            default: null,
        },
        calibrationTimeHr: {
            type: Number,
            default: 0,
        },
        calibrationTimeMin: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

// add plugin that converts mongoose to json
calibrationSchema.plugin(toJSON);
calibrationSchema.plugin(paginate);
const Calibration = mongoose.model('Calibration', calibrationSchema);

module.exports = Calibration;
