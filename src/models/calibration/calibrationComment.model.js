const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const calibrationCommentSchema = new mongoose.Schema(
    {
        schedulePreventive: {
            type: SchemaTypes.ObjectId,
            ref: 'schedulePreventive',
            default: null,
        },
        comments: {
            type: String,
        },
        status: {
            type: Boolean,
            default: false,
        },
        createdBy: {
            type: SchemaTypes.ObjectId,
            ref: 'User',
            default: null,
        },
        createdDate: {
            type: Date,
        },
        updatedBy: {
            type: SchemaTypes.ObjectId,
            ref: 'User',
            default: null,
        },
        updatedDate: {
            type: Date,
        },
    },
    { timestamps: true }
);

// add plugin that converts mongoose to json
calibrationCommentSchema.plugin(toJSON);
calibrationCommentSchema.plugin(paginate);
const CalibrationComment = mongoose.model('CalibrationComment',calibrationCommentSchema);

module.exports = CalibrationComment;
