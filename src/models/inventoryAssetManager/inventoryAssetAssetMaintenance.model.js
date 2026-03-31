const mongoose = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const inventoryAssetAssetMaintenanceSchema = mongoose.Schema(
    {
        inventoryAsset: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'InventoryAsset',
            default: null,
        },
        assetMaintenance: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'AssetMaintenance',
            default: null,
        },
        department: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'Department',
            default: null,
        },
        inventoryAssetDepartment: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'InventoryAssetDepartment',
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
        inventoryAssetDate: {
            type: Date,
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
inventoryAssetAssetMaintenanceSchema.plugin(toJSON);
inventoryAssetAssetMaintenanceSchema.plugin(paginate);

/**
 * @typedef User
 */
const InventoryAssetAssetMaintenance = mongoose.model('InventoryAssetAssetMaintenance', inventoryAssetAssetMaintenanceSchema);

module.exports = InventoryAssetAssetMaintenance;
