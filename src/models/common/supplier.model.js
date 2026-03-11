const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');
const preRemoveHook = require('../../utils/preRemoveHook');
const buildRefsToSchema = require('../../utils/buildRefsToSchema');

const supplierSchema = mongoose.Schema(
    {
        supplierName: {
            type: String,
            required: true,
            index: true,
        },
        phoneNumber: {
            type: String,
        },
        email: {
            type: String,
        },
        address: {
            type: String,
        },
        status: {
            type: Boolean,
            default: true,
            required: true
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
supplierSchema.plugin(toJSON);
supplierSchema.plugin(paginate);
supplierSchema.pre('remove', preRemoveHook(buildRefsToSchema('supplier')));

/**
 * @typedef User
 */
const supplier = mongoose.model('supplier', supplierSchema);

module.exports = supplier;
