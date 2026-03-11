const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const AssetModelDocumentSchema = mongoose.Schema(
    {
        assetModel: {
            type: SchemaTypes.ObjectId,
            default: null,
            ref: 'AssetModel',
        },
        documentCategory: {
            type: String,
            enum: ['instruction', 'troubleshooting', 'specification', 'drawing', 'other', "schedulePreventive", "calibration"],
        },
        resourceId: {
            type: SchemaTypes.ObjectId,
            ref: 'Resource',
            default: null,
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

    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
AssetModelDocumentSchema.plugin(toJSON);
AssetModelDocumentSchema.plugin(paginate);

/**
 * @typedef User
 */
const AssetModelDocument = mongoose.model('AssetModelDocument', AssetModelDocumentSchema);

module.exports = AssetModelDocument;
