const mongoose = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const documentSchema = mongoose.Schema(
    {
        documentName: {
            type: String,
            required: true,
            trim: true,
        },
        documentType: {
            type: String,
            required: true,
            trim: true,
        },
        documentSize: {
            type: String,
            required: true,
            trim: true,
        },
        file: {
            type: Buffer,
        },
    },
    {
        timestamps: true,
    }
);
// add plugin that converts mongoose to json
documentSchema.plugin(toJSON);
documentSchema.plugin(paginate);

/**
 * @typedef User
 */
const Document = mongoose.model('Document', documentSchema);

module.exports = Document;
