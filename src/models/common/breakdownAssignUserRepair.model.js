const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const breakdownAssignUserRepairSchema = new mongoose.Schema(
    {
        breakdownAssignUser: {
            type: SchemaTypes.ObjectId,
            ref: 'BreakdownAssignUser',
            default: null,
        },
        createdBy: {
            type: SchemaTypes.ObjectId,
            ref: 'User',
            default: null,
        },
        notes: {
            type: String, // Những ghi chú
        },
        problem: {
            type: String, //
        },
        rootCause: {
            type: String,
        },
        solution: {
            type: String,
        },
        comment: {
            type: String,
            default: '',
        },
        signature: {
            type: String,
        },
        rating: {
            type: String,
            enum: ['1', '2', '3', '4', '5'],
        },
        supervisoryNumber: {
            type: Number,
        },
        unit: {
            type: String,
            enum: ['Days', 'Hours'],
        },
        progressStatus: {
            type: String,
            enum: ['partialComplete', 'Incomplete'],
        },
        reAssignDate: {
            type: Date,
        },
        status: {
            type: Boolean,
            default: true,
        },
        signatoryIsName: {
            type: String,
        },
    },
    { timestamps: true }
);

// add plugin that converts mongoose to json
breakdownAssignUserRepairSchema.plugin(toJSON);
breakdownAssignUserRepairSchema.plugin(paginate);
const BreakdownAssignUserRepair = mongoose.model('BreakdownAssignUserRepair', breakdownAssignUserRepairSchema);
module.exports = BreakdownAssignUserRepair;
