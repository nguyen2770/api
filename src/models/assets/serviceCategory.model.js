const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const serviceCategorySchema = mongoose.Schema(
    {
        serviceCategoryName: {
            type: String,
            required: true,
            index: true,
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
serviceCategorySchema.plugin(toJSON);
serviceCategorySchema.plugin(paginate);

const ServiceCategory = mongoose.model('ServiceCategory', serviceCategorySchema);

module.exports = ServiceCategory;
