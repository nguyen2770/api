const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const breakdownAttachmentCloseSchema = new mongoose.Schema(
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
        position: {
            type: String
        }
    },
    { timestamps: true }
);

// add plugin that converts mongoose to json
breakdownAttachmentCloseSchema.plugin(toJSON);
breakdownAttachmentCloseSchema.plugin(paginate);
const BreakdownAttachmentClose = mongoose.model('breakdownAttachmentClose', breakdownAttachmentCloseSchema);

module.exports = BreakdownAttachmentClose;
