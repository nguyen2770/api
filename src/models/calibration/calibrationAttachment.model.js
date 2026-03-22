const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const calibrationAttachmentSchema = new mongoose.Schema(
    {
        calibrationWorkHistory: {
            type: SchemaTypes.ObjectId,
            ref: 'CalibrationWorkHistory',
            default: null,
        },
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
        resource: {
            type: SchemaTypes.ObjectId,
            ref: 'Resource',
            default: null,
        },
    },
    { timestamps: true }
);

// add plugin that converts mongoose to json
calibrationAttachmentSchema.plugin(toJSON);
calibrationAttachmentSchema.plugin(paginate);
const CalibrationAttachment = mongoose.model('CalibrationAttachment', calibrationAttachmentSchema);

module.exports = CalibrationAttachment;
