const mongoose = require('mongoose');

const { Schema } = mongoose;
const { toJSON, paginate } = require('../plugins');
const preRemoveHook = require('../../utils/preRemoveHook');
const buildRefsToSchema = require('../../utils/buildRefsToSchema');

const communeSchema = new Schema(
    {
        province: {
            type: mongoose.Types.ObjectId,
            ref: 'Province',
        },
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
        path: {
            type: String,
        },
        pathWithType: {
            type: String,
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
communeSchema.plugin(toJSON);
communeSchema.plugin(paginate);
communeSchema.pre('remove', preRemoveHook(buildRefsToSchema('Commune')));

/**
 * @typedef User
 */
const Commune = mongoose.model('Commune', communeSchema);
module.exports = Commune;
