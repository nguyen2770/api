const mongoose = require('mongoose');
const { SchemaTypes, Schema } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const serviceTaskSchema = Schema(
    {
        taskName: {
            type: String,
            required: true,
            trim: true,
        },
        taskType: {
            type: String,
            required: true,
            enum: ['inspection', 'monitoring', 'calibration'],
            /*
            inspection : kiểm tra
            monitoring : giám sát
            calibration : hiệu chuẩn
            */

        },
        sla: {
            type: Number,
            trim: true,
        },
        intervalType: {
            type: String,
            enum: ['minutes', 'hours'],
        },
        assignTo: {
            type: SchemaTypes.ObjectId,
            ref: 'User',
            default: null,
        },
        service: {
            type: SchemaTypes.ObjectId,
            ref: 'Service',
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
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
serviceTaskSchema.plugin(toJSON);
serviceTaskSchema.plugin(paginate);


/**
 * @typedef Service
 */
const ServiceTask = mongoose.model('ServiceTask', serviceTaskSchema);

module.exports = ServiceTask;
