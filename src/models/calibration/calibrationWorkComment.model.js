const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const calibrationWorkCommentSchema = new mongoose.Schema(
    {
        calibrationWork: {
            type: SchemaTypes.ObjectId,
            ref: 'CalibrationWork',
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
       
    },
    { timestamps: true }
);

// add plugin that converts mongoose to json
calibrationWorkCommentSchema.plugin(toJSON);
calibrationWorkCommentSchema.plugin(paginate);
const CalibrationWorkComment = mongoose.model('CalibrationWorkComment', calibrationWorkCommentSchema);

module.exports = CalibrationWorkComment;
