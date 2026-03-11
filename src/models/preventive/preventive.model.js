const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const preventiveSchema = new mongoose.Schema(
    {
        assetMaintenance: {
            type: SchemaTypes.ObjectId,
            ref: 'AssetMaintenance',
            default: null,
        },
        preventiveOfModel: {
            type: SchemaTypes.ObjectId,
            ref: 'PreventiveOfModel',
            default: null,
        },
        assetMaintenanceMonitoringPoint: {
            type: SchemaTypes.ObjectId,
            ref: 'AssetModelMonitoringPoint',
            default: null,
        },
        service: {
            type: SchemaTypes.ObjectId,
            ref: 'Service',
            default: null,
        },
        amc: {
            type: SchemaTypes.ObjectId,
            ref: 'Amc',
            default: null,
        },
        preventiveName: {
            type: String,
        },
        startDate: {
            type: Date,
        },
        endDate: {
            type: Date,
        },
        scheduleRepeatHours: {
            type: [Number],
            default: [],
        },
        scheduleRepeatDays: {
            type: [String],
            default: [],
        },
        calendarType: {
            type: String,
            enum: ['no-end-date', 'end-after', 'end-by'],
        },
        calenderFrequencyDuration: {
            type: Number,
            default: null,
        },
        frequencyValue: {
            type: Number,
            default: null,
        },
        frequencyType: {
            type: String,
            enum: ['Hours', 'RepeatHours', 'Days', 'Date', 'RepeaetWeekDays', 'Weeks', 'Months', 'Years'],
        },
        ticketStatus: {
            type: String,
            default: 'new',
            enum: ['new', 'inProgress', 'overdue', 'upcoming', 'closed'],
        },
        status: {
            type: String,
            default: 'new',
            enum: ['new', 'started', 'stoped'],
        },
        code: {
            type: String,
        },
        isStart: {
            type: Boolean,
            default: false,
        },
        monitoringType: {
            type: String,
            enum: ['every', 'on'],
        },
        calendarEndAfter: {
            type: Number,
        },
        calendarEndBy: {
            type: Date,
        },
        monitoringEvery: {
            type: Number,
        },
        monitoringOn: {
            type: Number,
        },
        scheduleType: {
            type: String,
            enum: ['Calendar', 'Monitoring', 'CalendarOrMonitoring', 'ConditionBasedSchedule', 'Adhoc'],
        },
        importance: {
            type: String,
            enum: ['Low', 'Medium', 'High'],
        },
        maintenanceDurationHr: {
            type: Number,
            default: 0,
        },
        maintenanceDurationMin: {
            type: Number,
            default: 0,
        },
        scheduleDate: {
            type: Date,
        },
        createdBy: {
            type: SchemaTypes.ObjectId,
            ref: 'User',
            default: null,
        },
        createdDate: {
            type: Date,
        },
        updatedBy: {
            type: SchemaTypes.ObjectId,
            ref: 'User',
            default: null,
        },
        updatedDate: {
            type: Date,
        },
        actualScheduleDate: {
            type: Date,
        },
        activity: {
            type: Boolean,
            default: true,
        },
        initialValue: {
            type: Number,
        },
        supervisor: {
            type: SchemaTypes.ObjectId,
            ref: 'User',
            default: null,
        },
        // tần suất để kiểm tra lịch bảo trì theo tình trạng
        frequency: {
            type: Number,
        },
        cycle: {
            type: String,
            enum: ['days', 'weeks', 'months', 'years'],
        },
    },
    { timestamps: true }
);

// add plugin that converts mongoose to json
preventiveSchema.plugin(toJSON);
preventiveSchema.plugin(paginate);
const Preventive = mongoose.model('Preventive', preventiveSchema);

module.exports = Preventive;
