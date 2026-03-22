const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const AssetMaintenanceChecklistSchema = mongoose.Schema(
    {
        assetMaintenance: {
            type: SchemaTypes.ObjectId,
            default: null,
            ref: 'AssetMaintenance',
        },
        assetModel: {
            type: SchemaTypes.ObjectId,
            default: null,
            ref: 'AssetModel',
        },
        content: {
            type: String,
            default: null,
        },
        index: {
            type: Number,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
AssetMaintenanceChecklistSchema.plugin(toJSON);
AssetMaintenanceChecklistSchema.plugin(paginate);

/**
 * @typedef User
 */
const AssetMaintenanceChecklist = mongoose.model('AssetMaintenanceChecklist', AssetMaintenanceChecklistSchema);

module.exports = AssetMaintenanceChecklist;
