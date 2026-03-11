const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const preventiveConditionBasedHistoryDetailSchema = new mongoose.Schema(
    {
        preventiveConditionBased: {
            type: SchemaTypes.ObjectId,
            ref: 'PreventiveConditionBased',
            default: null,
        },
        preventiveConditionBasedHistory: {
            type: SchemaTypes.ObjectId,
            ref: 'PreventiveConditionBasedHistory',
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
        measuredAt: {
            type: Date,
        },
    },
    { timestamps: true }
);

// add plugin that converts mongoose to json
preventiveConditionBasedHistoryDetailSchema.plugin(toJSON);
preventiveConditionBasedHistoryDetailSchema.plugin(paginate);
const PreventiveConditionBasedHistoryDetail = mongoose.model(
    'PreventiveConditionBasedHistoryDetail',
    preventiveConditionBasedHistoryDetailSchema
);

module.exports = PreventiveConditionBasedHistoryDetail;
