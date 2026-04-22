const mongoose = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const { SchemaTypes } = mongoose;

const StockMoveLineSchema = mongoose.Schema(
    {
        stockIssue: {
            type: SchemaTypes.ObjectId,
            ref: 'StockIssue',
        },
        stockReceipt: {
            type: SchemaTypes.ObjectId,
            ref: 'StockReceipt',
        },
        productQty: {
            type: Number,
        },
        productDoneQty: {
            type: Number,
            default: 0,
        },
        stockMove: {
            type: SchemaTypes.ObjectId,
            ref: 'StockMove',
        },
        itemType: {
            type: String,
            enum: ['SpareParts', 'AssetModel'],
        },
        spareParts: {
            type: SchemaTypes.ObjectId,
            ref: 'SpareParts',
        },
        assetModel: {
            type: SchemaTypes.ObjectId,
            ref: 'AssetModel',
        },
        assetMaintenance: {
            type: SchemaTypes.ObjectId,
            ref: 'AssetMaintenance',
        },
        Origin: {
            type: String,
        },
        isStockDelivery: {
            type: Boolean,
            default: false,
        },
        customer: {
            type: SchemaTypes.ObjectId,
            ref: 'Custommer',
        },
        unitPrice: {
            type: Number,
        },
        location: {
            type: SchemaTypes.ObjectId,
            ref: 'StockLocation',
        },
        locationDest: {
            type: SchemaTypes.ObjectId,
            ref: 'StockLocation',
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

StockMoveLineSchema.plugin(toJSON);
StockMoveLineSchema.plugin(paginate);

const StockMoveLine = mongoose.model('StockMoveLine', StockMoveLineSchema);

module.exports = StockMoveLine;

