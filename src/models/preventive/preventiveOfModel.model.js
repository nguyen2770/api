const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const preventiveOfModelSchema = new mongoose.Schema(
    {
        assetModel: {
            type: SchemaTypes.ObjectId,
            ref: 'AssetModel',
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
        // amc: {
        //     type: SchemaTypes.ObjectId,
        //     ref: 'Amc',
        //     default: null,
        // },
        preventiveName: {
            type: String,
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
        // isStart: {
        //     type: Boolean,
        //     default: false,
        // },
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
        supervisor: {
            type: SchemaTypes.ObjectId,
            ref: 'User',
            default: null,
        },
        frequency: {
            type: Number,
        },
        cycle: {
            type: String,
            enum: ['days', 'weeks', 'months', 'years'],
        },
        // actualScheduleDate: {
        //     type: Date,
        // },
        // status: { type: Boolean },
    },
    { timestamps: true }
);

// add plugin that converts mongoose to json
preventiveOfModelSchema.plugin(toJSON);
preventiveOfModelSchema.plugin(paginate);
const PreventiveOfModel = mongoose.model('PreventiveOfModel', preventiveOfModelSchema);

module.exports = PreventiveOfModel;
