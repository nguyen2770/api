const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const amcMappingAssetMaintenanceSchema = mongoose.Schema(
    {
        amc: {
            type: SchemaTypes.ObjectId,
            ref: 'Amc',
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

amcMappingAssetMaintenanceSchema.plugin(toJSON);
amcMappingAssetMaintenanceSchema.plugin(paginate);

const AmcMappingAssetMaintenance = mongoose.model('AmcMappingAssetMaintenance', amcMappingAssetMaintenanceSchema);
module.exports = AmcMappingAssetMaintenance;
