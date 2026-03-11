const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const schedulePrevetiveTaskSparePartRequestSchema = mongoose.Schema(
    {
        schedulePreventive: {
            type: SchemaTypes.ObjectId,
            ref: 'SchedulePreventive',
            default: null,
        },
        schedulePreventiveTask: {
            type: SchemaTypes.ObjectId,
            ref: 'SchedulePreventiveTask',
        },
        code: {
            type: String,
        },
        comment: {
            type: String,
        },
        requestStatus: {
            type: String,
            enum: [
                "pending_approval", "approved", "rejected", "submitted", "spareReplace"
            ],
            default: "pending_approval",
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
        assignUserDate: {
            type: Date,
        },
        holder: {
            type: SchemaTypes.ObjectId,
            ref: 'User',
            default: null,
        },
    },

    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
schedulePrevetiveTaskSparePartRequestSchema.plugin(toJSON);
schedulePrevetiveTaskSparePartRequestSchema.plugin(paginate);

/**
 * @typedef User
 */
const SchedulePrevetiveTaskSparePartRequest = mongoose.model('SchedulePrevetiveTaskSparePartRequest', schedulePrevetiveTaskSparePartRequestSchema);

module.exports = SchedulePrevetiveTaskSparePartRequest;
