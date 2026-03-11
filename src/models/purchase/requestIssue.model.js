const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const requestIssueSchema = mongoose.Schema(
    {
      
        code: {
            type: String,
        },
        description: {
            type: String,
        },
        expectedIssueDate: {
            type: Date,
        },
        createdBy: {
            type: SchemaTypes.ObjectId,
            ref: 'User',
            default: null,
        },
        action: {
            type: String,
            enum: ['pendingApproval', 'approved', 'rejected'],
            default: "pendingApproval",   
        },
        comment: {
            type: String,
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

requestIssueSchema.plugin(paginate);
requestIssueSchema.plugin(toJSON);


/**
 * @typedef User
 */
const RequestIssue = mongoose.model('RequestIssue', requestIssueSchema);

module.exports = RequestIssue;
