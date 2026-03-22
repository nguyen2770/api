const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const breakdownHistorySchema = new mongoose.Schema(
    {
        breakdown: {
            type: SchemaTypes.ObjectId,
            ref: 'Breakdown',
            default: null,
        },
        breakdownAssignUser: {
            type: SchemaTypes.ObjectId,
            ref: 'BreakdownAssignUser',
            default: null,
        },
        oldStatus: {
            type: String,
            enum: ['null', 'new', 'raised', 'assigned', 'accepted', 'rejected', 'reassignment', 'inProgress', 'completed', 'cancelled', 'replacement', 'requestForSupport', 'WCA', 'reopen', 'cloesed', 'experimentalFix'],
        },
        comment: {
            type: String,
            default: null,
        },
        status: {
            type: String,
            enum: ['raised', 'assigned', 'accepted', 'rejected', 'reassignment', 'inProgress', 'completed', 'cancelled', 'replacement', 'requestForSupport', 'WCA', 'reopen', 'cloesed', 'experimentalFix'],
        },
        indicaltedUserBy: {  // người  chỉdidnhj
            type: SchemaTypes.ObjectId,
            ref: 'User',
            default: null,
        },
        // cancelledUserBy: {
        //     type: SchemaTypes.ObjectId,
        //     ref: 'User',
        //     default: null,
        // },
        // designatedUser: {
        //     type: SchemaTypes.ObjectId, // người đc chỉ định
        //     ref: 'User',
        //     default: null,
        // },
        // openUser: {
        //     type: SchemaTypes.ObjectId,
        //     ref: 'User',
        //     default: null,
        // },
        // acceptedDate: {
        //     type: Date,
        // },
        // approvedBy: {
        //     // đc chấp thuận bởi
        //     type: SchemaTypes.ObjectId,
        //     ref: 'User',
        //     default: null,
        // },
        // closeDate: {
        //     type: Date,
        // },
        // closeBy: {
        //     type: SchemaTypes.ObjectId,
        //     ref: 'User',
        //     default: null,
        // },
        // reopenDate: {
        //     type: Date,
        // },
        // reopenBy: {
        //     type: SchemaTypes.ObjectId,
        //     ref: 'User',
        //     default: null,
        // },
        // experimentalFixDate: {
        //     type: Date,
        // },
        // experimentalFixBy: {
        //     type: SchemaTypes.ObjectId,
        //     ref: 'User',
        //     default: null,
        // },
        // requestForSupportDate: {
        //     type: Date,
        // },
        // requestForSupportBy: {
        //     type: SchemaTypes.ObjectId,
        //     ref: 'User',
        //     default: null,
        // },
        loginDate: {
            type: Date,
        },
        logoutDate: {
            type: Date,
            default: null,
        },
        estimatedCompletionDate: {
            type: Date,
        },
        workedBy: {
            type: SchemaTypes.ObjectId,
            ref: 'User',
            default: null,
        },
        workedDate: {
            type: Date,
        },
        // replacementDate: {
        //     type: Date,
        // },
        replacementUser: {
            type: SchemaTypes.ObjectId,
            ref: 'User',
            default: null,
        },
        // replacementBy: {
        //     type: SchemaTypes.ObjectId,
        //     ref: 'User',
        //     default: null,
        // },
        // fixedOnTrialDate: {
        //     type: Date,
        // },
        // fixedOnTrialBy: {
        //     type: SchemaTypes.ObjectId,
        //     ref: 'User',
        //     default: null,
        // },
    },
    { timestamps: true }
);

// add plugin that converts mongoose to json
breakdownHistorySchema.plugin(toJSON);
breakdownHistorySchema.plugin(paginate);
const BreakdownHistory = mongoose.model('BreakdownHistory', breakdownHistorySchema);

module.exports = BreakdownHistory;
