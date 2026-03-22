const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { paginate, toJSON } = require('../plugins');
const preRemoveHook = require('../../utils/preRemoveHook');
const buildRefsToSchema = require('../../utils/buildRefsToSchema');

const sparePartsSchema = mongoose.Schema(
    {
        currentStock: {
            type: Number, // lưu tổng 3 stock của 3 bang
        },
        description: {
            type: String,
            trim: true,
        },
        code: {
            type: String,
        },
        spareCategoryId: {
            type: SchemaTypes.ObjectId,
            ref: 'SpareCategory'
        },
        resourceId: {
            type: SchemaTypes.ObjectId,
            ref: 'Resource',

        },
        spareSubCategoryId: {
            type: SchemaTypes.ObjectId,
            ref: 'SpareSubCategory',
        },
        sparePartsName: {
            type: String,
            trim: true,
        },
        manufacturer: {
            type: SchemaTypes.ObjectId,
            ref: 'Manufacturer'
        },
        uomId: { //
            type: SchemaTypes.ObjectId,
            ref: 'Uom',

        },
        qrCode: {
            type: String,

            trim: true,
        },
        qrCodeImage: {
            type: String,
            trim: true,
        },
        lifeSpan: {
            type: Number,
        },
        Period: {
            type: Number,
        },
        stock: {
            type: Number,
            default: 0, // lưu tổng stock của spareParts
        },
        spareParts_price: { // unit rate
            type: String,
            trim: true,
        },
        reorderStock: { // reorder level
            type: String,
            trim: true,
            maxLength: 250,
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
        },
        cycleMiles: { // tính chu kỳ ra giây luôn
            type: Number,
        },
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json

sparePartsSchema.plugin(paginate);
sparePartsSchema.plugin(toJSON);
/**
 * @typedef SpareParts
 */

sparePartsSchema.pre('remove', preRemoveHook(buildRefsToSchema('SpareParts')));
const SpareParts = mongoose.model('SpareParts', sparePartsSchema);

module.exports = SpareParts;
