const mongoose = require('mongoose');
const { SchemaTypes, Schema } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const amcSparePartSchema = Schema(
    {
        sparePart: {
            type: SchemaTypes.ObjectId,
            ref: 'SpareParts',
            default: null,
        },
        amc: {
            type: SchemaTypes.ObjectId,
            ref: 'Amc',
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
amcSparePartSchema.plugin(toJSON);
amcSparePartSchema.plugin(paginate);

const AmcSparePart = mongoose.model('AmcSparePart', amcSparePartSchema);

module.exports = AmcSparePart;
