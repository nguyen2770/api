const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const assetModelSeftDiagnosiaAnswerValueSchema = mongoose.Schema(
    {
        value1: {
            type: String,
        },
        value2: {
            type: String,
        },
        assetModelSeftDiagnosia: {
            type: SchemaTypes.ObjectId,
            ref: 'AssetModelSeftDiagnosia',
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
assetModelSeftDiagnosiaAnswerValueSchema.plugin(toJSON);
assetModelSeftDiagnosiaAnswerValueSchema.plugin(paginate);

/**
 * @typedef User
 */
const AssetModelSeftDiagnosiaAnswerValue = mongoose.model('AssetModelSeftDiagnosiaAnswerValue', assetModelSeftDiagnosiaAnswerValueSchema);

module.exports = AssetModelSeftDiagnosiaAnswerValue;
