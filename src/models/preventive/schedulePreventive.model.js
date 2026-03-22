const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const schedulePreventiveSchema = new mongoose.Schema(
    {
        assetMaintenance: {
            type: SchemaTypes.ObjectId,
            ref: 'AssetMaintenance',
            default: null,
        },
        customer: {
            type: SchemaTypes.ObjectId,
            ref: 'Customer',
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
        preventive: {
            type: SchemaTypes.ObjectId,
            ref: 'Preventive',
            default: null,
        },
        scheduleDate: {
            type: Date,
        },
        startDate: {
            type: Date,
        },
        ticketStatus: {
            type: String,
            default: 'new',
            enum: ['new', 'inProgress', 'overdue', 'upcoming', 'history'],
        },
        status: {
            type: String,
            default: 'new',
            enum: ['new', 'inProgress', 'waitingForAdminApproval', 'skipped', 'completed', 'cancelled', 'submitted'],
        },
        code: {
            type: String,
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
        cancelDate: {
            type: Date,
        },
        cancelBy: {
            type: SchemaTypes.ObjectId,
            ref: 'User',
            default: null,
        },
        closingDate: {
            type: Date,
        },
        comment: {
            type: String,
        },
        commentClose: {
            type: String,
        },
        closeSignature: {
            type: String,
        },
        downtimeMin: {
            type: Number,
            default: 0,
        },
        downtimeHr: {
            type: Number,
            default: 0,
        },
        preventiveMonitoringHistory: {
            type: SchemaTypes.ObjectId,
            ref: 'PreventiveMonitoringHistory',
            default: null,
        },
        // Vị trí lúc tạo công việc bảo trì
        province: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Province',
            default: null
        },
        commune: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Commune',
            default: null
        },
        branch: {
            type: SchemaTypes.ObjectId,
            ref: 'Branch',
            default: null,
        },
        building: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Building',
            default: null,
        },
        floor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Floor',
            default: null,
        },
        department: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Department',
            default: null,
        },
        addressNote: {
            type: String,
        },
    },
    { timestamps: true }
);

// add plugin that converts mongoose to json
schedulePreventiveSchema.plugin(toJSON);
schedulePreventiveSchema.plugin(paginate);
const SchedulePreventive = mongoose.model('SchedulePreventive', schedulePreventiveSchema);

module.exports = SchedulePreventive;
