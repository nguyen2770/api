const mongoose = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const inventoryAssetSchema = mongoose.Schema(
    {
        title: {
            type: String,
        },
        code: {
            type: String,
        },
        startDate: {
            type: Date,
        },
        endDate: {
            type: Date,
        },
        isAllDeparment: {
            type: Boolean,
            default: true,
        },
        status: {
            type: String,
            default: 'draft',
            enum: ['draft', 'new', 'inProgress', 'done', 'await_approve'],
        },
        createdBy: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'User',
            default: null,
        },
        updatedBy: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'User',
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
inventoryAssetSchema.plugin(toJSON);
inventoryAssetSchema.plugin(paginate);

/**
 * @typedef User
 */
const InventoryAsset = mongoose.model('InventoryAsset', inventoryAssetSchema);

module.exports = InventoryAsset;
