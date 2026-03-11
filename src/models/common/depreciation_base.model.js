const mongoose = require('mongoose');
// const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const DepreciationBaseSchema = mongoose.Schema(
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
DepreciationBaseSchema.plugin(toJSON);
DepreciationBaseSchema.plugin(paginate);

/**
 * @typedef User
 */
const DepreciationBase = mongoose.model('Depreciation_base', DepreciationBaseSchema);

module.exports = DepreciationBase;
