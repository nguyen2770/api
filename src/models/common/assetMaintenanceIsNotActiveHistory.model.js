const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const assetMaintenanceIsNotActiveHistorySchema = mongoose.Schema(
    {
        assetMaintenance: {
            type: SchemaTypes.ObjectId,
            default: null,
            ref: 'AssetMaintenance',
        },
        startDate: {
            type: Date,
            default: null,
        },
        endDate: {
            type: Date,
            default: null,
        },
        // tổng thời gian thực số giây (sau khi )
        time: {
            type: Number,
        },
        origin: {
            type: SchemaTypes.ObjectId,
            default: null,
        },
        closedSource: {
            type: SchemaTypes.ObjectId,
            default: null,
        },
        createdBy: {
            type: SchemaTypes.ObjectId,
            ref: 'User',
        },
    },

    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
assetMaintenanceIsNotActiveHistorySchema.plugin(toJSON);
assetMaintenanceIsNotActiveHistorySchema.plugin(paginate);

/**
 * @typedef User
 */
const AssetMaintenanceIsNotActiveHistory = mongoose.model(
    'AssetMaintenanceIsNotActiveHistory',
    assetMaintenanceIsNotActiveHistorySchema
);

module.exports = AssetMaintenanceIsNotActiveHistory;
