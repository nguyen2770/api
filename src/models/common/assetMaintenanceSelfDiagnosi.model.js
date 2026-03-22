const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const assetMaintenanceSelfDiagnoisSchema = mongoose.Schema(
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
        status: {
            type: Boolean,
            default: true,
        }

    },

    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
assetMaintenanceSelfDiagnoisSchema.plugin(toJSON);
assetMaintenanceSelfDiagnoisSchema.plugin(paginate);

/**
 * @typedef User
 */
const AssetMaintenanceSelfDiagnosi = mongoose.model('AssetMaintenanceSelfDiagnosi', assetMaintenanceSelfDiagnoisSchema);

module.exports = AssetMaintenanceSelfDiagnosi;
