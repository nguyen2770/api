const mongoose = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const functionSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        code: {
            type: String,
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
functionSchema.plugin(toJSON);
functionSchema.plugin(paginate);

/**
 * @typedef User
 */
const Function = mongoose.model('Function', functionSchema);

module.exports = Function;
