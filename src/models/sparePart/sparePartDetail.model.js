const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { paginate, toJSON } = require('../plugins');
const preRemoveHook = require('../../utils/preRemoveHook');
const buildRefsToSchema = require('../../utils/buildRefsToSchema');

const sparePartDetailSchema = mongoose.Schema(
    {
        sparePart: {
            type: SchemaTypes.ObjectId,
            ref: "SpareParts"
        },
        stockReceiptDetail: {
            type: SchemaTypes.ObjectId,
            ref: "StockReceiptDetail"

        },
        manufacturer: {
            type: SchemaTypes.ObjectId,
            ref: "Manufacturer"
        },
        supplier: {
            type: SchemaTypes.ObjectId,
            ref: "supplier"
        },
        warehouseReceivedDate: {
            type: Date,
        },
        productionDate: {
            type: Date,
        },
        replacementDate: {
            type: Date,
        },
        qrCode: {
            type: String,
        },
        origin: {
            type: String,
        },
        qrCodeImage: {
            type: String,
        },
        assetMaintenance: {
            type: SchemaTypes.ObjectId,
            ref: "AssetMaintenance"
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

sparePartDetailSchema.plugin(paginate);
sparePartDetailSchema.plugin(toJSON);

sparePartDetailSchema.pre('remove', preRemoveHook(buildRefsToSchema('SparePartDetail')));
const SparePartDetail = mongoose.model('SparePartDetail', sparePartDetailSchema);

module.exports = SparePartDetail;
