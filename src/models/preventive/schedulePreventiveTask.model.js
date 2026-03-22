const mongoose = require('mongoose');
const { SchemaTypes, Schema } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const schedulePreventiveTaskSchema = Schema(
    {
        taskName: {
            type: String,
            required: true,
            trim: true,
        },
        taskType: {
            type: String,
            required: true,
            enum: ['inspection', 'monitoring', 'calibration', 'review', 'approval', 'spare-replacement'],
            /*
            inspection : kiểm tra
            monitoring : giám sát
            calibration : hiệu chuẩn
            */
        },
        schedulePreventive: {
            type: SchemaTypes.ObjectId,
            ref: 'SchedulePreventive',
            default: null,
        },
        preventiveTask: {
            type: SchemaTypes.ObjectId,
            ref: 'PreventiveTask',
            default: null,
        },
        preventive: {
            type: SchemaTypes.ObjectId,
            ref: 'Preventive',
            default: null,
        },
        amc: {
            type: SchemaTypes.ObjectId,
            ref: 'Amc',
            default: null,
        },
        sla: {
            type: Number,
            trim: true,
        },
        intervalType: {
            type: String,
            enum: ['minutes', 'hours'],
        },
        assignTo: {
            type: SchemaTypes.ObjectId,
            ref: 'User',
            default: null,
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
        comment: {
            type: String,
            default: null,
        },
        downtimeHr: {
            type: Number,
            default: 0,
        },
        downtimeMin: {
            type: Number,
            default: 0,
        },
        signature: {
            type: String,
        },
        // khi thay đổi hợp đồng
        isCancel: {
            type: Boolean,
            default: false,
        },
        incidentDeadline: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
schedulePreventiveTaskSchema.plugin(toJSON);
schedulePreventiveTaskSchema.plugin(paginate);

/**
 * @typedef Service
 */
const SchedulePreventiveTask = mongoose.model('SchedulePreventiveTask', schedulePreventiveTaskSchema);

module.exports = SchedulePreventiveTask;
