const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const preventiveSparePartSchema = new mongoose.Schema(
    {
        preventive: {
            type: SchemaTypes.ObjectId,
            ref: 'Preventive',
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
        amc: {
            type: SchemaTypes.ObjectId,
            ref: 'Amc',
            default: null,
        },
        preventiveOfModel: {
            type: SchemaTypes.ObjectId,
            ref: 'PreventiveOfModel',
            default: null,
        },
    },
    { timestamps: true }
);

// add plugin that converts mongoose to json
preventiveSparePartSchema.plugin(toJSON);
preventiveSparePartSchema.plugin(paginate);
const PreventiveSparePart = mongoose.model('PreventiveSparePart', preventiveSparePartSchema);

module.exports = PreventiveSparePart;
