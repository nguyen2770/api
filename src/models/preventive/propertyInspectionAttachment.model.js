const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const propertyInspectionAttachmentSchema = new mongoose.Schema(
    {
        propertyInspection: {
            type: SchemaTypes.ObjectId,
            ref: 'PropertyInspection',
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
propertyInspectionAttachmentSchema.plugin(toJSON);
propertyInspectionAttachmentSchema.plugin(paginate);
const PropertyInspectionAttachment = mongoose.model('PropertyInspectionAttachment', propertyInspectionAttachmentSchema);

module.exports = PropertyInspectionAttachment;
