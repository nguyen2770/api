const mongoose = require('mongoose');

const { Schema } = mongoose;
const { toJSON, paginate } = require('../plugins');
const preRemoveHook = require('../../utils/preRemoveHook');
const buildRefsToSchema = require('../../utils/buildRefsToSchema');

const floorSchema = new Schema(
    {
        floorName: {
            type: String,
            required: true
        },
        floorCapacity: {
            type: Number,

        },
        status: {
            type: Boolean,
            default: true
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        }
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
floorSchema.plugin(toJSON);
floorSchema.plugin(paginate);

floorSchema.pre('remove', preRemoveHook(buildRefsToSchema('Floor')));

/**
 * @typedef User
 */
const Floor = mongoose.model('Floor', floorSchema);

module.exports = Floor;

