const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');
const preRemoveHook = require('../../utils/preRemoveHook');
const buildRefsToSchema = require('../../utils/buildRefsToSchema');

const manufacturerSchema = mongoose.Schema(
    {
        manufacturerName: {
            type: String,
            required: true,
            index: true,
        },
        origin: {
            type: SchemaTypes.ObjectId,
            ref: 'Origin',
            default: null,
        },
        createdBy: {
            type: SchemaTypes.ObjectId,
            ref: 'User',
            default: null,
        },
        updatedBy: {
            type: SchemaTypes.ObjectId,
            ref: 'User',
            default: null,
        },
        resourceImportData: {
            type: SchemaTypes.ObjectId,
            ref: 'ResourceImportData',
            default: null,
        }
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
manufacturerSchema.plugin(toJSON);
manufacturerSchema.plugin(paginate);

manufacturerSchema.pre('remove', preRemoveHook(buildRefsToSchema('Manufacturer')));
/**
 * @typedef User
 */
const Manufacturer = mongoose.model('Manufacturer', manufacturerSchema);

module.exports = Manufacturer;
