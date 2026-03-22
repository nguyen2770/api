const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const repairContractMappingAssetMaintenanceSchema = mongoose.Schema(
    {
        repairContract: {
            type: SchemaTypes.ObjectId,
            ref: 'RepairContract',
            default: null,
        },
        assetMaintenance: {
            type: SchemaTypes.ObjectId,
            ref: 'AssetMaintenance',
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
repairContractMappingAssetMaintenanceSchema.plugin(toJSON);
repairContractMappingAssetMaintenanceSchema.plugin(paginate);

/**
 * @typedef User
 */
const RepairContractMappingAssetMaintenance = mongoose.model(
    'RepairContractMappingAssetMaintenance',
    repairContractMappingAssetMaintenanceSchema
);

module.exports = RepairContractMappingAssetMaintenance;
