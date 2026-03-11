const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const schedulePrevetiveTaskSparePartRequestDetailSchema = mongoose.Schema(
    {
        sparePart: {
            type: SchemaTypes.ObjectId,
            required: true,
            ref: 'SpareParts',
        },
        assetModelSparePart: {
            type: SchemaTypes.ObjectId,
            ref: 'AssetModelSpareParts',
        },
        schedulePrevetiveTaskSparePartRequest: {
            type: SchemaTypes.ObjectId,
            required: true,
            ref: 'SchedulePrevetiveTaskSparePartRequest',
        },
        spareRequestType: {
            type: String,
            enum: ['spareReplace', 'spareRequest'],
        },
        requestStatus: {
            type: String,
            enum: ['approved', 'pending_approval', 'rejected', 'submitted', 'spareReplace'],
            default: 'pending_approval',
        },
        comment: {
            type: String,
        },
        qty: {
            type: Number,
            default: 0,
        },
        unitCost: {
            type: Number,
            default: 0,
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
        rejectedDate: {
            type: Date,
        },
    },

    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
schedulePrevetiveTaskSparePartRequestDetailSchema.plugin(toJSON);
schedulePrevetiveTaskSparePartRequestDetailSchema.plugin(paginate);

/**
 * @typedef User
 */
const SchedulePrevetiveTaskSparePartRequestDetail = mongoose.model(
    'SchedulePrevetiveTaskSparePartRequestDetail',
    schedulePrevetiveTaskSparePartRequestDetailSchema
);

module.exports = SchedulePrevetiveTaskSparePartRequestDetail;
