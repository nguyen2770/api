const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');
const preRemoveHook = require('../../utils/preRemoveHook');
const AssetModel = require('../common/assetModel.model');

const categorySchema = mongoose.Schema(
    {
        categoryName: {
            type: String,
            required: true,
            index: true,
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
categorySchema.plugin(toJSON);
categorySchema.plugin(paginate);

categorySchema.pre('remove', preRemoveHook([
    { model: AssetModel, field: 'category' },
]));

/**
 * @typedef User
 */
const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
