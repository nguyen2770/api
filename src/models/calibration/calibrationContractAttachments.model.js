const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const calibrationContractAttachmentsSchema = mongoose.Schema(
    {
        calibrationContract: {
            type: SchemaTypes.ObjectId,
            ref: 'CalibrationContract',
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
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
calibrationContractAttachmentsSchema.plugin(toJSON);
calibrationContractAttachmentsSchema.plugin(paginate);

/**
 * @typedef User
 */
const CalibrationContractAttachments = mongoose.model('CalibrationContractAttachments', calibrationContractAttachmentsSchema);

module.exports = CalibrationContractAttachments;
