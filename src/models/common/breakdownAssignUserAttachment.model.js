const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const breakdownAssignUserAttachmentSchema = new mongoose.Schema(
    {
        breakdownAssignUserRepair: {
            type: SchemaTypes.ObjectId,
            ref: 'BreakdownAssignUserRepair',
            default: null,
        },
        breakdownAssignUser: {
            type: SchemaTypes.ObjectId,
            ref: 'BreakdownAssignUser',
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
breakdownAssignUserAttachmentSchema.plugin(toJSON);
breakdownAssignUserAttachmentSchema.plugin(paginate);
const BreakdownAssignUserAttachment = mongoose.model('BreakdownAssignUserAttachment', breakdownAssignUserAttachmentSchema);

module.exports = BreakdownAssignUserAttachment;
