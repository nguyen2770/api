const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const assetMaintenanceSolutionBankSchema = mongoose.Schema(
    {
        assetMaintenanceId: {
            type: SchemaTypes.ObjectId,
            default: null,
            ref: 'AssetMaintenance',
        },
        assetMaintenanceDefectId: {
            type: SchemaTypes.ObjectId,
            default: null,
            ref: 'AssetMaintenanceDefect',
        },
        rootCause: {
            type: String,
            default: null,
        },
        solution: {
            type: String,
            default: null,
        },
        solutionType: {
            type: Boolean,
            default: true,
        },
        status: {
            type: Boolean,
            default: true,
        },
        ticketId: {
            type: SchemaTypes.ObjectId,
            ref: 'Ticket',
            default: null,
        },
        createdBy: {
            type: SchemaTypes.ObjectId,
            ref: 'User',
            default: null,
        },
        createdDate: {
            type: Date,
            default: Date.now,
        },
        assetModelId: {
            type: SchemaTypes.ObjectId,
            ref: 'AssetModel',
            default: null,
        },

    },

    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
assetMaintenanceSolutionBankSchema.plugin(toJSON);
assetMaintenanceSolutionBankSchema.plugin(paginate);

/**
 * @typedef User
 */
const AssetMaintenanceSolutionBank = mongoose.model('AssetMaintenanceSolutionBank', assetMaintenanceSolutionBankSchema);

module.exports = AssetMaintenanceSolutionBank;
