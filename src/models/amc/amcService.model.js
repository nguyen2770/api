const mongoose = require('mongoose');
const { SchemaTypes, Schema } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const amcServiceSchema = Schema(
    {
        service: {
            type: SchemaTypes.ObjectId,
            ref: 'Service',
            default: null,
        },
        amc: {
            type: SchemaTypes.ObjectId,
            ref: 'Amc',
            default: null,
        },
        assetModel: {
            type: SchemaTypes.ObjectId,
            ref: 'AssetModel',
            default: null,
        },
        frequencyNumber: {
            type: Number
        },
        noOfAsset: {
            type: Number
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
amcServiceSchema.plugin(toJSON);
amcServiceSchema.plugin(paginate);

const AmcServiceSchema = mongoose.model('AmcServiceSchema', amcServiceSchema);

module.exports = AmcServiceSchema;
