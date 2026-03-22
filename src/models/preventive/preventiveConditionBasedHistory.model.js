const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const preventiveConditionBasedHistorySchema = new mongoose.Schema(
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
        createdBy: {
            type: SchemaTypes.ObjectId,
            ref: 'User',
        },
        note: {
            type: String,
            default: null,
        },
    },
    { timestamps: true }
);

// add plugin that converts mongoose to json
preventiveConditionBasedHistorySchema.plugin(toJSON);
preventiveConditionBasedHistorySchema.plugin(paginate);
const PreventiveConditionBasedHistory = mongoose.model(
    'PreventiveConditionBasedHistory',
    preventiveConditionBasedHistorySchema
);

module.exports = PreventiveConditionBasedHistory;
