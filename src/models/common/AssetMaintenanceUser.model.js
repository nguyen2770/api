const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const assetMaintenanceUserSchema = mongoose.Schema(
    {
        assetMaintenance: {
            type: SchemaTypes.ObjectId,
            default: null,
            ref: 'AssetMaintenance',
        },
        user: {
            type: SchemaTypes.ObjectId,
            default: null,
            ref: 'User',
        }
    },

    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
assetMaintenanceUserSchema.plugin(toJSON);
assetMaintenanceUserSchema.plugin(paginate);

/**
 * @typedef User
 */
const AssetMaintenanceUser = mongoose.model('AssetMaintenanceUser', assetMaintenanceUserSchema);

module.exports = AssetMaintenanceUser;
