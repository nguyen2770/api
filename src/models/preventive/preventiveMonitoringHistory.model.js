const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const preventiveMonitoringHistorySchema = new mongoose.Schema(
    {
        preventiveMonitoring: {
            type: SchemaTypes.ObjectId,
            ref: 'PreventiveMonitoring',
            default: null,
        },
        // giá trị trước
        previousMeterValue: {
            type: Number,
        },
        // giá trị nhập vào
        meterValue: {
            type: Number,
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
    },
    { timestamps: true }
);

// add plugin that converts mongoose to json
preventiveMonitoringHistorySchema.plugin(toJSON);
preventiveMonitoringHistorySchema.plugin(paginate);
const PreventiveMonitoringHistory = mongoose.model('PreventiveMonitoringHistory', preventiveMonitoringHistorySchema);

module.exports = PreventiveMonitoringHistory;
