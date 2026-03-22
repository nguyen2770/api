const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const assetModelParameterSchema = mongoose.Schema(
    {
        name: {
            type: String,
        },
        value: {
            type: String,
        },
        content: {
            type: String,
        }, createdBy: {
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
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
assetModelParameterSchema.plugin(toJSON);
assetModelParameterSchema.plugin(paginate);

/**
 * @typedef User
 */
const AssetModelParameter = mongoose.model('AssetModelParameter', assetModelParameterSchema);

module.exports = AssetModelParameter;
