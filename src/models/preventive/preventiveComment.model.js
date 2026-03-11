const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const preventiveCommentSchema = new mongoose.Schema(
    {
        preventive: {
            type: SchemaTypes.ObjectId,
            ref: 'Preventive',
            default: null,
        },
        comments: {
            type: String,
        },
        status: {
            type: Boolean,
            default: false,
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
    { timestamps: true }
);

// add plugin that converts mongoose to json
preventiveCommentSchema.plugin(toJSON);
preventiveCommentSchema.plugin(paginate);
const PreventiveComment = mongoose.model('PreventiveComment', preventiveCommentSchema);

module.exports = PreventiveComment;
