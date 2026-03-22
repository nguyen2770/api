const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const resourceImportDataSchema = mongoose.Schema(
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
        sourceSave: {
            type: String,
        },
        confirmFileDeletion: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
resourceImportDataSchema.plugin(toJSON);
resourceImportDataSchema.plugin(paginate);

/**
 * @typedef User
 */
const ResourceImportData = mongoose.model('ResourceImportData', resourceImportDataSchema);

module.exports = ResourceImportData;
