const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const propertyInspectionTaskSchema = new mongoose.Schema(
    {
        propertyInspection: {
            type: SchemaTypes.ObjectId,
            ref: 'PropertyInspection',
            default: null,
        },
        content: {
            type: String,
            default: null,
        },
        index: {
            type: Number,
            default: null,
        },
        status: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// add plugin that converts mongoose to json
propertyInspectionTaskSchema.plugin(toJSON);
propertyInspectionTaskSchema.plugin(paginate);
const PropertyInspectionTask = mongoose.model('PropertyInspectionTask', propertyInspectionTaskSchema);

module.exports = PropertyInspectionTask;
