const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const assetModelSolutionSchema = mongoose.Schema(
    {
        name: {
            type: String,
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
        },
        reasonOrigin: {
            type: String,
            required: true,
        },
        solutionContent: {
            type: String,
            required: true,
        }
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
assetModelSolutionSchema.plugin(toJSON);
assetModelSolutionSchema.plugin(paginate);

/**
 * @typedef User
 */
const AssetModelSolution = mongoose.model('AssetModelSolution', assetModelSolutionSchema);

module.exports = AssetModelSolution;
