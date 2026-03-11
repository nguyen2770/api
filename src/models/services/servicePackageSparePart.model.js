const mongoose = require('mongoose');
const { SchemaTypes, Schema } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const servicePackageSparePartSchema = Schema(
    {
        sparePart: {
            type: SchemaTypes.ObjectId,
            ref: 'SpareParts',
            default: null,
        },
        servicePackage: {
            type: SchemaTypes.ObjectId,
            ref: 'ServicePackage',
            default: null,
        },
        sortIndex: {
            type: Number
        }
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
servicePackageSparePartSchema.plugin(toJSON);
servicePackageSparePartSchema.plugin(paginate);


/**
 * @typedef ServicePackageSparePart
 */
const ServicePackageSparePart = mongoose.model('ServicePackageSparePart', servicePackageSparePartSchema);

module.exports = ServicePackageSparePart;
