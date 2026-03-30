const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const groupSchema = mongoose.Schema(
    {
        groupName: {
            type: String,
            required: true,
            index: true,
        },
        status: {
            type: Boolean,
            default: true,
            required: true,
        },
        createdBy: {
            type: SchemaTypes.ObjectId,
            ref: 'User',
            default: null,
        },
        parenId: {
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
groupSchema.plugin(toJSON);
groupSchema.plugin(paginate);

/**
 * @typedef User
 */
const Group = mongoose.model('Group', groupSchema);

module.exports = Group;
