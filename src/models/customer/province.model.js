const mongoose = require('mongoose');

const { Schema } = mongoose;
const { toJSON, paginate } = require('../plugins');

const provinceSchema = new Schema(
    {
        name: {
            type: String,
        },
        slug: {
            type: String,
        },
        type: {
            type: String,
        },
        nameWithType: {
            type: String,
        },
        code: {
            type: Number,
        },
        resourceImportData: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ResourceImportData',
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
provinceSchema.plugin(toJSON);
provinceSchema.plugin(paginate);

/**
 * @typedef User
 */
const Province = mongoose.model('Province', provinceSchema);

module.exports = Province;
