const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const calibrationContractMappingAssetMaintenanceSchema = mongoose.Schema(
    {
        calibrationContract: {
            type: SchemaTypes.ObjectId,
            ref: 'CalibrationContract',
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

calibrationContractMappingAssetMaintenanceSchema.plugin(toJSON);
calibrationContractMappingAssetMaintenanceSchema.plugin(paginate);

const CalibrationContractMappingAssetMaintenance = mongoose.model(
    'CalibrationContractMappingAssetMaintenance',
    calibrationContractMappingAssetMaintenanceSchema
);
module.exports = CalibrationContractMappingAssetMaintenance;
