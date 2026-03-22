const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const assetMaintenanceDefectSchema = mongoose.Schema(
    {
        assetMaintenanceId: {
            type: SchemaTypes.ObjectId,
            default: null,
            ref: 'AssetMaintenance',
        },
        name: {
            type: String,
            default: null,
        },
        status: {
            type: Boolean,
            default: true,
        },
         defectTags: {
            type: [String],
            default: [],
        },
    },

    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
assetMaintenanceDefectSchema.plugin(toJSON);
assetMaintenanceDefectSchema.plugin(paginate);

/**
 * @typedef User
 */
const AssetMaintenanceDefect = mongoose.model('AssetMaintenanceDefect', assetMaintenanceDefectSchema);

module.exports = AssetMaintenanceDefect;
