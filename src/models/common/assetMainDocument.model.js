const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const assetMaintenanceDocumentSchema = mongoose.Schema(
    {
        assetMaintenance: {
            type: SchemaTypes.ObjectId,
            default: null,
            ref: 'AssetMaintenance',
        },
        assetMaintenanceDefect: {
            type: SchemaTypes.ObjectId,
            default: null,
            ref: 'AssetMaintenanceDefect',
        },
        attachFileName: {
            type: String,
            default: null,
        },
        attachType: {
            type: Number,
            default: null,
        },
        isOthersAttachType: {
            type: String,
            default: null,
        },
        attachmentFilePath: {
            type: String,
            default: true,
        },
        documentCategory: {
            type: String,
        },
        fileType: {
            type: String,
            enum: [
                "ASSET_CANCEL",  
                "ASSET_RETURN",   
                "OTHER"          
            ],
            default: "OTHER"
        },
        resource: {
            type: SchemaTypes.ObjectId,
            ref: 'Resource',
            default: null,
        },
    },

    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
assetMaintenanceDocumentSchema.plugin(toJSON);
assetMaintenanceDocumentSchema.plugin(paginate);

/**
 * @typedef User
 */
const AssetMaintenanceDocument = mongoose.model('AssetMaintenanceDocument', assetMaintenanceDocumentSchema);

module.exports = AssetMaintenanceDocument;
