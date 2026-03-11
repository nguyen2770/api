const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const assetTypeSchema = mongoose.Schema(
    {
        assetTypeCategory: {
            type: SchemaTypes.ObjectId,
            ref: 'AssetTypeCategory',
        },
        asset: {
            type: SchemaTypes.ObjectId,
            ref: 'Asset',
        },
        note: {
            type: String,
            default: null,
        },
        expectedPrice: {
            type: Number,
        },
        status: {
            type: Boolean,
            default: true,
            required: true
        },
        createdBy: {
            type: SchemaTypes.ObjectId,
            ref: 'User',
            required: true,
        },
        updatedBy: {
            type: SchemaTypes.ObjectId,
            ref: 'User',
            required: true,
        }
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
assetTypeSchema.plugin(toJSON);
assetTypeSchema.plugin(paginate);

/**
 * @typedef User
 */
const AssetType = mongoose.model('AssetType', assetTypeSchema);

module.exports = AssetType;
