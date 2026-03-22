const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const assetTypeManufacturerSchema = mongoose.Schema(
    {
        assetType: {
            type: SchemaTypes.ObjectId,
            ref: 'AssetType',
        },
        manufacturer: {
            type: SchemaTypes.ObjectId,
            ref: 'Manufacturer',
        },
        createdBy: {
            type: SchemaTypes.ObjectId,
            ref: 'User',
        },
        updatedBy: {
            type: SchemaTypes.ObjectId,
            ref: 'User',
        }
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
assetTypeManufacturerSchema.plugin(toJSON);
assetTypeManufacturerSchema.plugin(paginate);

/**
 * @typedef User
 */
const AssetTypeManufacturer = mongoose.model('AssetTypeManufacturer', assetTypeManufacturerSchema);

module.exports = AssetTypeManufacturer;
