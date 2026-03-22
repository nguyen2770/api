const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const breakdownAssignUserCheckinCheckOutSchema = new mongoose.Schema(
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
        breakdownAssignUser: {
            type: SchemaTypes.ObjectId,
            ref: 'BreakdownAssignUser',
            default: null,
        },
        logInAt: {
            type: Date,
        },
        logOutAt: {
            type: Date,
        },
        checkOutComments: {
            type: String,
        },
    },
    { timestamps: true }
);

// add plugin that converts mongoose to json
breakdownAssignUserCheckinCheckOutSchema.plugin(toJSON);
breakdownAssignUserCheckinCheckOutSchema.plugin(paginate);
const BreakdownAssignUserCheckinCheckOut = mongoose.model(
    'BreakdownAssignUserCheckinCheckOut',
    breakdownAssignUserCheckinCheckOutSchema
);

module.exports = BreakdownAssignUserCheckinCheckOut;
