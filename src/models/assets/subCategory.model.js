const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');
const preRemoveHook = require('../../utils/preRemoveHook');
const AssetModel = require('../common/assetModel.model');

const subCategorySchema = mongoose.Schema(
    {
        subCategoryName: {
            type: String,
            required: true,
            index: true,
        },
        status: {
            type: Boolean,
            default: true,
            required: true,
        },
        categoryId: {
            type: SchemaTypes.ObjectId,
            ref: 'Category',
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
subCategorySchema.plugin(toJSON);
subCategorySchema.plugin(paginate);
subCategorySchema.pre('remove', preRemoveHook([
    { model: AssetModel, field: 'subCategory' },
]));

/**
 * @typedef User
 */
const SubCategory = mongoose.model('SubCategory', subCategorySchema);

module.exports = SubCategory;
