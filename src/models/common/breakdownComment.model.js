const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const breakdownCommentSchema = new mongoose.Schema(
    {
        breakdown: {
            type: SchemaTypes.ObjectId,
            ref: 'Breakdown',
            default: null,
        },
        createdBy: {
            type: SchemaTypes.ObjectId,
            ref: 'User',
            default: null,
        },
        comments: {
            type: String,
        },
        createdDate: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

// add plugin that converts mongoose to json
breakdownCommentSchema.plugin(toJSON);
breakdownCommentSchema.plugin(paginate);
const BreakdownComment = mongoose.model('BreakdownComment', breakdownCommentSchema);

module.exports = BreakdownComment;
