const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const calibrationWorkTimelineSchema = new mongoose.Schema(
    {
        calibrationWork: {
            type: SchemaTypes.ObjectId,
            ref: 'CalibrationWork',
            required: true,
        },

        calibrationWorkAssignUser: {
            type: SchemaTypes.ObjectId,
            ref: 'CalibrationWorkAssignUser',
            default: null,
        },

        oldStatus: {
            type: String,
            enum: [
                'null',
                'new',
                'assigned',
                'accepted',
                'rejected',
                'replacement',
                'inProgress',
                'completed',
                'cancelled',
                'reopen',
                'cloesed',
                'reassignment',
                'partiallyCompleted',
                'completeRecalibrationIssue',
            ],
            default: 'null',
        },

        status: {
            type: String,
            enum: [
                'new',
                'assigned',
                'accepted',
                'rejected',
                'replacement',
                'inProgress',
                'completed',
                'cancelled',
                'reopen',
                'cloesed',
                'reassignment',
                'partiallyCompleted',
                'completeRecalibrationIssue',
            ],
            required: true,
        },
        comment: {
            type: String,
            default: null,
        },
        indicatedUserBy: {
            type: SchemaTypes.ObjectId,
            ref: 'User',
            default: null,
        },
        designatedUser: {
            type: SchemaTypes.ObjectId,
            ref: 'User',
            default: null,
        },
        acceptedDate: {
            type: Date,
            default: null,
        },
        acceptedBy: {
            type: SchemaTypes.ObjectId,
            ref: 'User',
            default: null,
        },
        workedBy: {
            type: SchemaTypes.ObjectId,
            ref: 'User',
            default: null,
        },
        workedDate: {
            type: Date,
            default: null,
        },
        replacementUser: {
            type: SchemaTypes.ObjectId,
            ref: 'User',
            default: null,
        },
        replacementReason: {
            type: String,
            default: null,
        },
        isPassed: {
            type: Boolean,
            default: null,
        },
        loginDate: {
            type: Date,
            default: null,
        },
        logoutDate: {
            type: Date,
            default: null,
        },
        estimatedCompletionDate: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// plugins
calibrationWorkTimelineSchema.plugin(toJSON);
calibrationWorkTimelineSchema.plugin(paginate);

const CalibrationWorkTimeline = mongoose.model(
    'CalibrationWorkTimeline',
    calibrationWorkTimelineSchema
);

module.exports = CalibrationWorkTimeline;
