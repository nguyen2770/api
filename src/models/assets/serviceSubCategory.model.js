const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const serviceSubCategorySchema = mongoose.Schema(
    {
        serviceSubCategoryName: {
            type: String,
            required: true,
            index: true,
        },
        serviceCategory: {
            type: SchemaTypes.ObjectId,
            ref: 'ServiceCategory',
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
serviceSubCategorySchema.plugin(toJSON);
serviceSubCategorySchema.plugin(paginate);

const ServiceSubCategory = mongoose.model('ServiceSubCategory', serviceSubCategorySchema);

module.exports = ServiceSubCategory;
