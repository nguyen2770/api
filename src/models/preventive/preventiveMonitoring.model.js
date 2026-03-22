const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const preventiveMonitoringSchema = new mongoose.Schema(
    {
        preventive: {
            type: SchemaTypes.ObjectId,
            ref: 'Preventive',
            default: null,
        },
        // giá trị nhập vào
        meterValue: {
            type: Number,
            default: 0,
        },
        activity: {
            type: Boolean,
            default: true,
        },
        startDate: {
            type: Date,
        },
        endDate: {
            type: Date,
        },
        createdBy: {
            type: SchemaTypes.ObjectId,
            ref: 'User',
            default: null,
        },
        updatedBy: {
            type: SchemaTypes.ObjectId,
            ref: 'User',
            default: null,
        },
        supervisor: {
            type: SchemaTypes.ObjectId,
            ref: 'User',
            default: null,
        },
    },
    { timestamps: true }
);

// add plugin that converts mongoose to json
preventiveMonitoringSchema.plugin(toJSON);
preventiveMonitoringSchema.plugin(paginate);
const PreventiveMonitoring = mongoose.model('PreventiveMonitoring', preventiveMonitoringSchema);

module.exports = PreventiveMonitoring;
