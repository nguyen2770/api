const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const assetModelSolutionTagSchema = mongoose.Schema(
    {
        name: {
            type: String,
        },
        assetModelSolution: {
            type: SchemaTypes.ObjectId,
            ref: 'AssetModelSolution',
            default: null,
        },
        sortIndex: {
            type: Number
        }
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
assetModelSolutionTagSchema.plugin(toJSON);
assetModelSolutionTagSchema.plugin(paginate);

/**
 * @typedef User
 */
const AssetModelSolutionTag = mongoose.model('AssetModelSolutionTag', assetModelSolutionTagSchema);

module.exports = AssetModelSolutionTag;
