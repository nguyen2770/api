const mongoose = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const sequenceSchema = mongoose.Schema(
    {
        name: {
            type: String,
        },
        numberNext: {
            type: Number,
            default: null,
        },
        padding: {
            type: Number,
            default: null,
        },
        numberIncrement: {
            type: Number,
            default: null,
        },
        code: {
            type: String,
            trim: true,
        },
        prefix: {
            type: String,
        },
        year: {
            type: Number,
        },
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
sequenceSchema.plugin(toJSON);
sequenceSchema.plugin(paginate);

/**
 * @typedef User
 */
const Sequence = mongoose.model('Sequence', sequenceSchema);

module.exports = Sequence;
