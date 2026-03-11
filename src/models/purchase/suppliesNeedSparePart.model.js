const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const suppliesNeedSparePartSchema = mongoose.Schema(
    {
        suppliesNeed: {
            type: SchemaTypes.ObjectId,
            ref: 'SuppliesNeed',
            default: null,
            required: true,
        },
        itemType: {
            type: String,
            enum: ['SpareParts', 'AssetModel'],
            required: true,
        },
        sparePart: {
            type: SchemaTypes.ObjectId,
            ref: 'SpareParts',
            default: null,
        },
        asset: {
            type: SchemaTypes.ObjectId,
            ref: 'Asset',
            default: null,
        },
        assetTypeCategory: {
            type: SchemaTypes.ObjectId,
            ref: 'AssetTypeCategory',
            default: null,
        },
        manufacturer: {
            type: SchemaTypes.ObjectId,
            ref: 'Manufacturer',
            default: null,
        },
        assetModel: {
            type: SchemaTypes.ObjectId,
            ref: 'AssetModel',
            default: null,
        },
        qty: {
            type: Number
        },
        sortIndex: {
            type: Number
        },
        uom: {
            type: SchemaTypes.ObjectId,
            ref: 'Uom',
        },
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
suppliesNeedSparePartSchema.plugin(toJSON);
suppliesNeedSparePartSchema.plugin(paginate);

/**
 * @typedef User
 */
const SuppliesNeedSparePart = mongoose.model('SuppliesNeedSparePart', suppliesNeedSparePartSchema);

module.exports = SuppliesNeedSparePart;
