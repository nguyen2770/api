const mongoose = require('mongoose');
const { toJSON, paginate } = require('../plugins');
const preRemoveHook = require('../../utils/preRemoveHook');
const buildRefsToSchema = require('../../utils/buildRefsToSchema');


const buildingSchema = mongoose.Schema(
    {
        buildingName: {
            type: String,
            required: true
        },
        buildingCapacity: {
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
buildingSchema.plugin(toJSON);
buildingSchema.plugin(paginate);

buildingSchema.pre('remove', preRemoveHook(buildRefsToSchema('Building')));



/**
 * @typedef User
 */
const Building = mongoose.model('Building', buildingSchema);

module.exports = Building;

