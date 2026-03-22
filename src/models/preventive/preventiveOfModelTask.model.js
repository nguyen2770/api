const mongoose = require('mongoose');
const { SchemaTypes, Schema } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const preventiveOfModelTaskSchema = Schema(
    {
        preventiveOfModel: {
            type: SchemaTypes.ObjectId,
            ref: 'PreventiveOfModel',
            default: null,
        },
        taskName: {
            type: String,
            required: true,
            trim: true,
        },
        taskType: {
            type: String,
            required: true,
            enum: ['inspection', 'monitoring', 'calibration', 'review', 'approval', 'spare-replacement'],
            /*
            inspection : kiểm tra
            monitoring : giám sát
            calibration : hiệu chuẩn
            */
        },
        amc: {
            type: SchemaTypes.ObjectId,
            ref: 'Amc',
            default: null,
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
preventiveOfModelTaskSchema.plugin(toJSON);
preventiveOfModelTaskSchema.plugin(paginate);

/**
 * @typedef Service
 */
const PreventiveOfModelTask = mongoose.model('PreventiveOfModelTask', preventiveOfModelTaskSchema);

module.exports = PreventiveOfModelTask;
