const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const breakdownSpareRequestSchema = mongoose.Schema(
    {
        breakdown: {
            type: SchemaTypes.ObjectId,
            required: true,
            ref: "Breakdown",
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
                "pending_approval", "approved","rejected", "submitted", "spareReplace"
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
    },

    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
breakdownSpareRequestSchema.plugin(toJSON);
breakdownSpareRequestSchema.plugin(paginate);

/**
 * @typedef User
 */
const BreakdownSpareRequest = mongoose.model('BreakdownSpareRequest', breakdownSpareRequestSchema);

module.exports = BreakdownSpareRequest;
