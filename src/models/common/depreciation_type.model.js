const mongoose = require('mongoose');
// const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const DepreciationTypeSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            index: true,
        },
        code: {
            type: Number,
            required: true,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
DepreciationTypeSchema.plugin(toJSON);
DepreciationTypeSchema.plugin(paginate);

/**
 * @typedef User
 */
const DepreciationType = mongoose.model('Depreciation_type', DepreciationTypeSchema);

module.exports = DepreciationType;
