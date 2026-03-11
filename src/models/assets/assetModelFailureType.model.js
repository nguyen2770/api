const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const assetModelFailureTypeSchema = mongoose.Schema(
    {
        name: {
            type: String,
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
        assetModel: {
            type: SchemaTypes.ObjectId,
            ref: 'AssetModel',
            default: null,
        },
        isDefault: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
assetModelFailureTypeSchema.plugin(toJSON);
assetModelFailureTypeSchema.plugin(paginate);

/**
 * @typedef User
 */
const AssetModelFailureType = mongoose.model('AssetModelFailureType', assetModelFailureTypeSchema);

module.exports = AssetModelFailureType;
