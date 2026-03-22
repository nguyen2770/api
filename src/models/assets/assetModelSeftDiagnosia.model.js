const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const assetModelSeftDiagnosiaSchema = mongoose.Schema(
    {
        name: {
            type: String,
        },
        question: {
            type: String,
        },
        answerType: {
            type: String,
            enum: ['option', 'range'],
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
        updatedBy: {
            type: SchemaTypes.ObjectId,
            ref: 'User',
            default: null,
        },
        assetModel: {
            type: SchemaTypes.ObjectId,
            ref: 'AssetModel',
            default: null,
        },
        assetModelFailureType: {
            type: SchemaTypes.ObjectId,
            ref: 'AssetModelFailureType',
            default: null,
        }
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
assetModelSeftDiagnosiaSchema.plugin(toJSON);
assetModelSeftDiagnosiaSchema.plugin(paginate);

/**
 * @typedef User
 */
const AssetModelSeftDiagnosia = mongoose.model('AssetModelSeftDiagnosia', assetModelSeftDiagnosiaSchema);

module.exports = AssetModelSeftDiagnosia;
