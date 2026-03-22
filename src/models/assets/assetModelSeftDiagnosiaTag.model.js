const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const assetModelSeftDiagnosiaTagSchema = mongoose.Schema(
    {
        name: {
            type: String,
        },
        assetModelSeftDiagnosia: {
            type: SchemaTypes.ObjectId,
            ref: 'AssetModelSeftDiagnosia',
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
assetModelSeftDiagnosiaTagSchema.plugin(toJSON);
assetModelSeftDiagnosiaTagSchema.plugin(paginate);

/**
 * @typedef User
 */
const AssetModelSeftDiagnosiaTag = mongoose.model('AssetModelSeftDiagnosiaTag', assetModelSeftDiagnosiaTagSchema);

module.exports = AssetModelSeftDiagnosiaTag;
