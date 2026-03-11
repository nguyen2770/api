const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');
const preRemoveHook = require('../../utils/preRemoveHook');
const AmcServiceSchema = require('../amc/amcService.model');
const AssetMaintenance = require('./assetMaintenance.model');
const RequestPurchaseDetail = require('../purchase/purchaseRequestDetails.model');
const SuppliesNeedSparePart = require('../purchase/suppliesNeedSparePart.model');

const assetModelSchema = mongoose.Schema(
    {
        assetModelName: {
            type: String,
            index: true,
        },
        asset: {
            type: SchemaTypes.ObjectId,
            ref: 'Asset',
            default: null,
        },
        manufacturer: {
            type: SchemaTypes.ObjectId,
            ref: 'Manufacturer',
            default: null,
        },
        supplier: {
            type: SchemaTypes.ObjectId,
            ref: 'supplier',
            default: null,
        },
        category: {
            type: SchemaTypes.ObjectId,
            ref: 'Category',
            default: null,
        },
        subCategory: {
            type: SchemaTypes.ObjectId,
            ref: 'SubCategory',
            default: null,
        },
        assetTypeCategory: {
            type: SchemaTypes.ObjectId,
            ref: 'AssetTypeCategory',
            default: null,
        },
        assetStyle: {
            type: Number,
            default: null,
            enum: [1, 2, 3],
        },
        status: {
            type: Boolean,
            default: true,
        },
        resourceImportData: {
            type: SchemaTypes.ObjectId,
            ref: 'ResourceImportData',
            default: null,
        }
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
assetModelSchema.plugin(toJSON);
assetModelSchema.plugin(paginate);

assetModelSchema.pre('remove', preRemoveHook([
    { model: AmcServiceSchema, field: 'assetModel' },
    { model: AssetMaintenance, field: 'assetModel' },
    { model: RequestPurchaseDetail, field: 'assetModel' },
    { model: SuppliesNeedSparePart, field: 'assetModel' },

]));


/**
 * @typedef User
 */
const AssetModel = mongoose.model('AssetModel', assetModelSchema);

module.exports = AssetModel;
