const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const assetTypeParameterSchema = mongoose.Schema(
    {
        name: {
            type: String,
        },
        value: {
            type: Number,
        },
        discription: {
            type: String,
        },
        uom: {
            type: SchemaTypes.ObjectId,
            ref: 'Uom',
            default: null,
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
        assetType: {
            type: SchemaTypes.ObjectId,
            ref: 'AssetType',
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
assetTypeParameterSchema.plugin(toJSON);
assetTypeParameterSchema.plugin(paginate);

/**
 * @typedef User
 */
const AssetTypeParameter = mongoose.model('AssetTypeParameter', assetTypeParameterSchema);

module.exports = AssetTypeParameter;
