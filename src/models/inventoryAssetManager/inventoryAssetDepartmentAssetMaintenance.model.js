
const mongoose = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const inventoryAssetDepartmentAssetMaintenanceSchema = mongoose.Schema(
    {
        inventoryAsset: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'InventoryAsset',
            default: null,
        },
        inventoryAssetDepartment: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'InventoryAssetDepartment',
            default: null,
        },
        inventoryAssetDate: {
            type: Date
        },
        assetMaintenance: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'AssetMaintenance',
            default: null,
        },
        assetModel: {
            type: mongoose.SchemaTypes.ObjectId,
            default: null,
            ref: 'AssetModel',
        },
        asset: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Asset',
        },
        status: {
            type: String,
            default: 'exist',
            enum: [
                'exist',
                'does_not_exist',
                'not_yet_inventoried'
            ],
        },
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
inventoryAssetDepartmentAssetMaintenanceSchema.plugin(toJSON);
inventoryAssetDepartmentAssetMaintenanceSchema.plugin(paginate);

/**
 * @typedef User
 */
const InventoryAssetDepartmentAssetMaintenance = mongoose.model('InventoryAssetDepartmentAssetMaintenance', inventoryAssetDepartmentAssetMaintenanceSchema);

module.exports = InventoryAssetDepartmentAssetMaintenance;
