const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const assetTypeCategorySchema = mongoose.Schema(
    {
        name: {
            type: String,
        },
        status: {
            type: Boolean,
            default: true,
        },
        createdBy: {
            type: SchemaTypes.ObjectId,
            ref: 'User',
            default: null,
        },
        updatedBy: {
            type: SchemaTypes.ObjectId,
            ref: 'User',
            default: null,
        },
        resourceImportData: {
            type: SchemaTypes.ObjectId,
            ref: 'ResourceImportData',
            default: null,
        }
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
assetTypeCategorySchema.plugin(toJSON);
assetTypeCategorySchema.plugin(paginate);

/**
 * @typedef User
 */
const AssetTypeCategory = mongoose.model('AssetTypeCategory', assetTypeCategorySchema);

module.exports = AssetTypeCategory;
