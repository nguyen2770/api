const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const preventiveOfModelSparePartSchema = new mongoose.Schema(
    {
        preventiveOfModel: {
            type: SchemaTypes.ObjectId,
            ref: 'PreventiveOfModel',
            default: null,
        },
        sparePart: {
            type: SchemaTypes.ObjectId,
            ref: 'SpareParts',
            default: null,
        },
        quantity: {
            type: Number,
        },
    },
    { timestamps: true }
);

// add plugin that converts mongoose to json
preventiveOfModelSparePartSchema.plugin(toJSON);
preventiveOfModelSparePartSchema.plugin(paginate);
const PreventiveOfModelSparePart = mongoose.model('PreventiveOfModelSparePart', preventiveOfModelSparePartSchema);

module.exports = PreventiveOfModelSparePart;
