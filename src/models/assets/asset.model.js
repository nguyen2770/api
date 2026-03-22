const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');
const AssetModel = require('../common/assetModel.model');
const preRemoveHook = require('../../utils/preRemoveHook');
const RequestPurchaseDetail = require('../purchase/purchaseRequestDetails.model');
const SuppliesNeedSparePart = require('../purchase/suppliesNeedSparePart.model');
const AssetType = require('./assetType.model');

const assetSchema = mongoose.Schema(
    {
        assetName: {
            type: String,
            required: true,
            index: true,
        },
        symbol: {
            type: String,
        },
        status: {
            type: Boolean,
            default: true,
            required: true,
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
        resourceImportData: {
            type: SchemaTypes.ObjectId,
            ref: 'ResourceImportData',
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
assetSchema.plugin(toJSON);
assetSchema.plugin(paginate);

assetSchema.pre(
    'remove',
    preRemoveHook([
        { model: AssetModel, field: 'asset' },
        { model: RequestPurchaseDetail, field: 'asset' },
        { model: SuppliesNeedSparePart, field: 'asset' },
        { model: AssetType, field: 'asset' },
    ])
);

/**
 * @typedef User
 */
const Asset = mongoose.model('Asset', assetSchema);

module.exports = Asset;
