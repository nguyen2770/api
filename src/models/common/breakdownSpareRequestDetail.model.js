const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const breakdownSpareRequestDetailSchema = mongoose.Schema(
    {
        assetModelSparePart: {
            type: SchemaTypes.ObjectId,
            required: true,
            ref: 'AssetModelSparePart',
        },
        breakdownSpareRequest: {
            type: SchemaTypes.ObjectId,
            required: true,
            ref: "BreakdownSpareRequest",
        },
        spareRequestType: {
            type: String,
            enum: ["spareReplace", "spareRequest"],
        },
        requestStatus: {
            type: String,
            enum: [ "approved",
                "pending_approval", "rejected", "submitted", "spareReplace"
            ],
            default: "pending_approval",
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
    },

    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
breakdownSpareRequestDetailSchema.plugin(toJSON);
breakdownSpareRequestDetailSchema.plugin(paginate);

/**
 * @typedef User
 */
const BreakdownSpareRequestDetail = mongoose.model('BreakdownSpareRequestDetail', breakdownSpareRequestDetailSchema);

module.exports = BreakdownSpareRequestDetail;
