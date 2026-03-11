const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const resourceSchema = mongoose.Schema(
    {
        fileName: {
            type: String,
            index: true,
            trim: true,
        },
        extension: {
            type: String,
            trim: true,
        },
        fileType: {
            type: String,
            trim: true,
        },
        filePath: {
            type: String,
            trim: true,
        },
        createdBy: {
            type: SchemaTypes.ObjectId,
            ref: 'User',
            default: null,
        },
        createdDate: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
resourceSchema.plugin(toJSON);
resourceSchema.plugin(paginate);

/**
 * @typedef User
 */
const Resource = mongoose.model('Resource', resourceSchema);

module.exports = Resource;
