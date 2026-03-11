const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const AssetModelChecklistSchema = mongoose.Schema(
    {
        assetModel: {
            type: SchemaTypes.ObjectId,
            default: null,
            ref: 'AssetModel',
        },
        content: {
            type: String,
            default: null,
        },
        answerTypeInspection: {
            type: String,
            enum: ['yes/no/na', 'value', 'numberic-value'],
        },
        note: {
            type: String,
            default: null,
        },
        index: {
            type: Number,
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
AssetModelChecklistSchema.plugin(toJSON);
AssetModelChecklistSchema.plugin(paginate);

/**
 * @typedef User
 */
const AssetModelChecklist = mongoose.model('AssetModelChecklist', AssetModelChecklistSchema);

module.exports = AssetModelChecklist;
