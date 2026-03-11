const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const breakdownSpareRequestAssignUserSchema = mongoose.Schema(
    {
        breakdownSpareRequest: {
            type: SchemaTypes.ObjectId,
            required: true,
            ref: "BreakdownSpareRequest",
        },
        user: {
            type: SchemaTypes.ObjectId,
            required: true,
            ref: "User",
        },
    },

    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
breakdownSpareRequestAssignUserSchema.plugin(toJSON);
breakdownSpareRequestAssignUserSchema.plugin(paginate);

/**
 * @typedef User
 */
const BreakdownSpareRequestAssignUser = mongoose.model('BreakdownSpareRequestAssignUser', breakdownSpareRequestAssignUserSchema);

module.exports = BreakdownSpareRequestAssignUser;
