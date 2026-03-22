const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');
const SpareParts = require('../sparePart/spareParts.model');
const SpareSubCategory = require('./spareSubCategory.model');
const preRemoveHook = require('../../utils/preRemoveHook');

const spareCategorySchema = mongoose.Schema(
    {
        spareCategoryName: {
            type: String,
            required: true,
            index: true,
        },
        isConsumables: {
            type: Boolean,
            default: true,
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
spareCategorySchema.plugin(toJSON);
spareCategorySchema.plugin(paginate);

spareCategorySchema.pre('remove', preRemoveHook([
    { model: SpareParts, field: 'spareCategoryId' },
    { model: SpareSubCategory, field: 'spareCategory' },
]));

const SpareCategory = mongoose.model('SpareCategory', spareCategorySchema);

module.exports = SpareCategory;
