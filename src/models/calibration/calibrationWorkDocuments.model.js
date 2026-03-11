const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const calibrationWorkDocumentsSchema = new mongoose.Schema(
    {
        calibrationWork: {
            type: SchemaTypes.ObjectId,
            ref: 'CalibrationWork',
            default: null,
        },
        resource: {
            type: SchemaTypes.ObjectId,
            ref: 'Resource',
            default: null,
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
    },
    { timestamps: true }
);

// add plugin that converts mongoose to json
calibrationWorkDocumentsSchema.plugin(toJSON);
calibrationWorkDocumentsSchema.plugin(paginate);
const CalibrationWorkDocuments = mongoose.model('CalibrationWorkDocuments', calibrationWorkDocumentsSchema);

module.exports = CalibrationWorkDocuments;
