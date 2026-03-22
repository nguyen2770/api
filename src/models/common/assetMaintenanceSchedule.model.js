const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const assetMaintenanceScheduleSchema = mongoose.Schema(
    {
        assetMaintenanceId: {
            type: SchemaTypes.ObjectId,
            default: null,
            ref: 'AssetMaintenance',
        },
        serviceContractorId: {
            type: SchemaTypes.ObjectId,
            default: null,
            ref: 'ServiceContractor',
        },
        assetMaintenanceMonitoringPoint: {
            type: SchemaTypes.ObjectId,
            default: null,
            ref: 'AssetModelMonitoringPoint',
        },
        is_service_based_on: {
            type: Boolean,
            default: true,
        },
        maintenance_based_on: {
            type: Number,
            default: null,
        },
        maintenance_managed_by: {
            type: Number,
            default: null,
        },
        meter_frequency_type: {
            type: Number,
            default: null,
        },
        maintenance_name: {
            type: String,
            default: null,
        },
        maintenance_priority: {
            type: Number,
            required: null,
        },
        schedule_repeat_hours: {
            type: [Number],
            default: [],
        },
        schedule_repeat_days: {
            type: [Number],
            default: [],
        },
        maintenance_duration_min: {
            type: Number,
            default: 0,
        },
        maintenance_duration_hr: {
            type: Number,
            default: 0,
        },
        meter_schedule_every: {
            type: Number,
            default: 0,
        },
        meter_schedule_on: {
            type: Number,
            default: 0,
        },
        meter_schedule_type: {
            type: Number,
            default: null,
        },
        revision: {
            type: String,
            default: null,
        },
        document_number: {
            type: String,
            default: null,
        },
        // //tần số bảo trì
        calender_frequency_duration: {
            type: Number,
            default: 0,
        },
        calender_frequency_interval: {
            type: Number,
            default: null,
        },
        schedule_stop_duration_end: {
            type: Number,
            default: null,
        },
        schedule_stop_duration_date: {
            type: Date,
            default: null,
        },
        // Lưu giá trị type ví dụ: 1 - no en date,2 - End after,3
        schedule_stop_interval: {
            type: Number,
            default: null,
        },
        schedule_date: {
            type: Date,
            default: null,
        },
        createdDate: {
            type: Date,
            default: Date.now,
        },
        updatedBy: {
            type: SchemaTypes.ObjectId,
            ref: 'User',
            default: null,
        },
        updatedDate: {
            type: Date,
            default: Date.now,
        },
    },

    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
assetMaintenanceScheduleSchema.plugin(toJSON);
assetMaintenanceScheduleSchema.plugin(paginate);

/**
 * @typedef User
 */
const AssetMaintenanceScheduleSchema = mongoose.model('AssetMaintenanceScheduleSchema', assetMaintenanceScheduleSchema);

module.exports = AssetMaintenanceScheduleSchema;
