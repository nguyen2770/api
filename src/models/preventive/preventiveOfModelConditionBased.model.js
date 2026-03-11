const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const preventiveOfModelConditionBasedSchema = new mongoose.Schema(
    {
        preventiveOfModel: {
            type: SchemaTypes.ObjectId,
            ref: 'PreventiveOfModel',
            default: null,
        },
        condition: {
            type: String,
        },
        uom: {
            type: SchemaTypes.ObjectId,
            ref: 'Uom',
            default: null,
        },
        value: {
            type: Number,
        },
        note: {
            type: String,
        },
    },
    { timestamps: true }
);

// add plugin that converts mongoose to json
preventiveOfModelConditionBasedSchema.plugin(toJSON);
preventiveOfModelConditionBasedSchema.plugin(paginate);
const PreventiveOfModelConditionBased = mongoose.model(
    'PreventiveOfModelConditionBased',
    preventiveOfModelConditionBasedSchema
);

module.exports = PreventiveOfModelConditionBased;
