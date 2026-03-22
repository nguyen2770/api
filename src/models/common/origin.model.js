const mongoose = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const originSchema = mongoose.Schema(
    {
        originName : {
            type: String,
        }
    },
    {
        timestamps: true,
    }
);
// add plugin that converts mongoose to json
originSchema.plugin(toJSON);
originSchema.plugin(paginate);

/**
 * @typedef User
 */
const Origin = mongoose.model('Origin', originSchema);

module.exports = Origin;
