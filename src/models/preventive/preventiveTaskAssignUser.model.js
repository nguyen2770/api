const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const preventiveTaskAssignUserSchema = new mongoose.Schema(
    {
        preventive: {
            type: SchemaTypes.ObjectId,
            ref: 'Preventive',
            default: null,
        },
        user: {
            type: SchemaTypes.ObjectId,
            ref: 'User',
            default: null,
        },
        preventiveTask: {
            type: SchemaTypes.ObjectId,
            ref: 'PreventiveTask',
            default: null,
        },

    },
    { timestamps: true }
);

// add plugin that converts mongoose to json
preventiveTaskAssignUserSchema.plugin(toJSON);
preventiveTaskAssignUserSchema.plugin(paginate);
const PreventiveTaskAssignUser = mongoose.model('PreventiveTaskAssignUser', preventiveTaskAssignUserSchema);

module.exports = PreventiveTaskAssignUser;
