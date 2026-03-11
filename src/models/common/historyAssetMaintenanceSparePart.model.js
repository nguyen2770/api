const mongoose = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const historyAssetMaintenanceSparePartSchema = mongoose.Schema(
    {
        assetMaintenance: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
            ref: 'AssetMaintenance',
        },
        originSparePart: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
        },
        sparePart: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
            ref: 'SpareParts',
        },
        quantity: {
            type: Number,
            default: 0,
        },
        replacementDate: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
historyAssetMaintenanceSparePartSchema.plugin(toJSON);
historyAssetMaintenanceSparePartSchema.plugin(paginate);

/**
 * @typedef User
 */
const HistoryAssetMaintenanceSparePart = mongoose.model(
    'HistoryAssetMaintenanceSparePart',
    historyAssetMaintenanceSparePartSchema
);

module.exports = HistoryAssetMaintenanceSparePart;
