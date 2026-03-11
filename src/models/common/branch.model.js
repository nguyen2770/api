const mongoose = require('mongoose');
const { toJSON, paginate } = require('../plugins');
const preRemoveHook = require('../../utils/preRemoveHook');
const buildRefsToSchema = require('../../utils/buildRefsToSchema');


const branchSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
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
    }, { timestamps: true }
);

// add plugin that converts mongoose to json
branchSchema.plugin(toJSON);
branchSchema.plugin(paginate);

branchSchema.pre('remove', preRemoveHook(buildRefsToSchema('Branch')));

const branch = mongoose.model('Branch', branchSchema)

module.exports = branch;
