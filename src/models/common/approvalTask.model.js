const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const ApprovalTaskSchema = mongoose.Schema(
    {

        sourceType: {
            type: String,
            enum: [
                "spare_request_breakdown",
                "spare_request_schedule_preventive",
                "close_breakdown",
                "preventive",
                "close_calibration",
                "trial_repair_approval",
                "supplies_need",
                "purchase_request",
            ]
        },

        sourceId: {
            type: SchemaTypes.ObjectId,
        },

        title: {
            type: String,
        },

        data: {
            type: Object,
        },

        description: {
            type: String,
        },

        status: {
            type: String,
            enum: ["PENDING", "PROCESSED"],
            default: "PENDING"
        },

        requestUser: {
            type: SchemaTypes.ObjectId,
            ref: 'User',
        },

        processedAt: {
            type: Date,
        },

        processedBy: {
            type: SchemaTypes.ObjectId,
            ref: 'User',
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
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
ApprovalTaskSchema.plugin(toJSON);
ApprovalTaskSchema.plugin(paginate);

/**
 * @typedef User
 */
const ApprovalTask = mongoose.model('ApprovalTask', ApprovalTaskSchema);

module.exports = ApprovalTask;
