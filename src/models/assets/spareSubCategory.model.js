const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');
const SpareParts = require('../sparePart/spareParts.model');
const preRemoveHook = require('../../utils/preRemoveHook');

const spareSubCategorySchema = mongoose.Schema(
    {
        spareSubCategoryName: {
            type: String,
            required: true,
            index: true,
        },
        spareCategory: {
            type: SchemaTypes.ObjectId,
            ref: 'SpareCategory',
            required: true,
        },
        status: {
            type: Boolean,
            default: true,
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
        }
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
spareSubCategorySchema.plugin(toJSON);
spareSubCategorySchema.plugin(paginate);

spareSubCategorySchema.pre('remove', preRemoveHook([
    { model: SpareParts, field: 'spareSubCategoryId' },
]));

const SpareSubCategory = mongoose.model('SpareSubCategory', spareSubCategorySchema);

module.exports = SpareSubCategory;
