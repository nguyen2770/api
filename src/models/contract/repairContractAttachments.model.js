const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const repairContractAttachmentsSchema = mongoose.Schema(
    {
        repairContract: {
            type: SchemaTypes.ObjectId,
            ref: 'RepairContract',
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
repairContractAttachmentsSchema.plugin(toJSON);
repairContractAttachmentsSchema.plugin(paginate);

/**
 * @typedef User
 */
const RepairContractAttachments = mongoose.model('RepairContractAttachments', repairContractAttachmentsSchema);

module.exports = RepairContractAttachments;
