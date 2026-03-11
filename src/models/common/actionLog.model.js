const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const ActionLogSchema = mongoose.Schema(
    {

        action: String,
        method: String,
        route: String,
        params: SchemaTypes.Mixed,
        query: SchemaTypes.Mixed,

        request: SchemaTypes.Mixed,
        response: SchemaTypes.Mixed,

        before: SchemaTypes.Mixed,
        after: SchemaTypes.Mixed,

        statusCode: Number,
        ip: String,
        userAgent: String,

        duration: Number,

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
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
ActionLogSchema.plugin(toJSON);
ActionLogSchema.plugin(paginate);

/**
 * @typedef User
 */
const ActionLog = mongoose.model('ActionLog', ActionLogSchema);

module.exports = ActionLog;
