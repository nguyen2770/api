const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const preventiveConditionBasedSchema = new mongoose.Schema(
    {
        preventive: {
            type: SchemaTypes.ObjectId,
            ref: 'Preventive',
            default: null,
        },
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
        measuredValue: {
            type: Number,
        },
        note: {
            type: String,
        },
        activity: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

// add plugin that converts mongoose to json
preventiveConditionBasedSchema.plugin(toJSON);
preventiveConditionBasedSchema.plugin(paginate);
const PreventiveConditionBased = mongoose.model('PreventiveConditionBased', preventiveConditionBasedSchema);

module.exports = PreventiveConditionBased;
