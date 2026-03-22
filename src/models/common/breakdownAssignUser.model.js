const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const breakdownAssignUserSchema = new mongoose.Schema(
    {
        breakdown: {
            type: SchemaTypes.ObjectId,
            ref: 'Breakdown',
            default: null,
        },
        user: {
            type: SchemaTypes.ObjectId,
            ref: 'User',
            default: null,
        },
        repairContract: {
            type: SchemaTypes.ObjectId,
            ref: 'RepairContract',
            default: null,
        },
        status: {
            type: String,
            default: 'assigned',
            enum: [
                'assigned',
                'accepted',
                'rejected',
                'reassignment',
                'inProgress',
                'completed',
                'cancelled',
                'replacement',
                'requestForSupport',
                'WCA',
                'cloesed',
                'experimentalFix',
                'pending_approval',
                'approved',
                'submitted',
            ],
        },
        comment: {
            type: String,
            default: '',
        },
        expectedRepairTime: {
            type: Date,
        },
        comfirmTime: {
            type: Date,
            // default: Date.now,
        },
        cancellationTime: {
            type: Date,
            // default: Date.now,
        },
        reasonCancel: {
            type: String,
            default: '',
        },
        loginStatus: {
            type: String,
            default: 'logOut',
            enum: ['logIn', 'logOut'],
        },
        // expectedRepairHours: {
        //     type: Number, // số giờ dự kiến sửa chữa
        // },
        // expectedRepairMins: {
        //     type: Number, // số giờ dự kiến sửa chữa
        // },
        estimatedCompletionDate: {
            type: Date, // ngày dự kiến hoàn thành  }
        },
        completedDate: {
            type: Date,
        },
    },
    { timestamps: true }
);

// add plugin that converts mongoose to json
breakdownAssignUserSchema.plugin(toJSON);
breakdownAssignUserSchema.plugin(paginate);
const BreakdownAssignUser = mongoose.model('BreakdownAssignUser', breakdownAssignUserSchema);

module.exports = BreakdownAssignUser;
