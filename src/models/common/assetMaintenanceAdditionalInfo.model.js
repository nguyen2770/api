const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const assetMaintenanceAdditionalInfoSchema = mongoose.Schema(
    {
        assetMaintenanceId: {
            type: SchemaTypes.ObjectId,
            default: null,
            ref: 'AssetMaintenance',
        },
        label: {
            type: String,
            default: null,
        },
        name: {
            type: String,
            default: null,
        },
        value: {
            type: String,
            default: null,
        },
        type: {
            type: Number,
            default: null,
        },
    },

    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
assetMaintenanceAdditionalInfoSchema.plugin(toJSON);
assetMaintenanceAdditionalInfoSchema.plugin(paginate);

/**
 * @typedef User
 */
const AssetMaintenanceAdditionalInfo = mongoose.model(
    'AssetMaintenanceAdditionalInfo',
    assetMaintenanceAdditionalInfoSchema
);

module.exports = AssetMaintenanceAdditionalInfo;
