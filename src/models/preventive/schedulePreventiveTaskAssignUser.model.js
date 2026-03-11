const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const schedulePreventiveTaskAssignUserSchema = new mongoose.Schema(
    {
        schedulePreventive: {
            type: SchemaTypes.ObjectId,
            ref: 'SchedulePreventive',
            default: null,
        },
        schedulePreventiveTask: {
            type: SchemaTypes.ObjectId,
            ref: 'SchedulePreventiveTask',
            default: null,
        },
        user: {
            type: SchemaTypes.ObjectId,
            ref: 'User',
            default: null,
        },
        confirmDate: {
            type: Date,
            default: null,
        },
        cancelConfirmDate: {
            type: Date,
            default: null,
        },
        status: {
            type: String,
            default: 'assigned',
            enum: [
                'assigned',
                'accepted',
                'replacement',
                'inProgress',
                'cancelled',
                'reassignment',
                'completed',
                'partiallyCompleted',
                'skipped',
                'pending_approval',
                'approved',
                'submitted',
            ], // partiallyCompleted hoàn thành 1 phần khi tạo sự cố
        },
        reasonCancelConfirm: {
            type: String,
        },
        signature: {
            type: String,
        },
        isCancel: {
            type: Boolean,
            default: false,
        },
        signatoryIsName: {
            type: String,
        },
        completedDate: {
            type: Date,
        },
    },
    { timestamps: true }
);

// add plugin that converts mongoose to json
schedulePreventiveTaskAssignUserSchema.plugin(toJSON);
schedulePreventiveTaskAssignUserSchema.plugin(paginate);
const SchedulePreventiveTaskAssignUser = mongoose.model(
    'SchedulePreventiveTaskAssignUser',
    schedulePreventiveTaskAssignUserSchema
);

module.exports = SchedulePreventiveTaskAssignUser;
