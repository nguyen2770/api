const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const amcAttachmentsSchema = mongoose.Schema(
    {
        amc: {
            type: SchemaTypes.ObjectId,
            ref: 'Amc',
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
amcAttachmentsSchema.plugin(toJSON);
amcAttachmentsSchema.plugin(paginate);

/**
 * @typedef User
 */
const AmcAttachments = mongoose.model('AmcAttachments', amcAttachmentsSchema);

module.exports = AmcAttachments;
