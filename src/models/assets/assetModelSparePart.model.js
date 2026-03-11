const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const assetModelSparePartSchema = mongoose.Schema(
    {
        assetModel: {
            type: SchemaTypes.ObjectId,
            default: null,
            ref: 'AssetModel',
        },
        sparePart: {
            type: SchemaTypes.ObjectId,
            default: null,
            ref: 'SpareParts',
        },
        quantity: {
            type: Number,
        },
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
assetModelSparePartSchema.plugin(toJSON);
assetModelSparePartSchema.plugin(paginate);

/**
 * @typedef User
 */
const AssetModelSparePart = mongoose.model('AssetModelSparePart', assetModelSparePartSchema);

module.exports = AssetModelSparePart;
