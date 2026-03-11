const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const breakdownAttachmentSchema = new mongoose.Schema(
    {
        breakdown: {
            type: SchemaTypes.ObjectId,
            ref: 'Breakdown',
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
breakdownAttachmentSchema.plugin(toJSON);
breakdownAttachmentSchema.plugin(paginate);
const BreakdownAttachment = mongoose.model('BreakdownAttachment', breakdownAttachmentSchema);

module.exports = BreakdownAttachment;
