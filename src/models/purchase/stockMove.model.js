const mongoose = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const { SchemaTypes } = mongoose;

const StockMoveSchema = mongoose.Schema(
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
        origin: {
            type: String,
        },
        location: {
            type: SchemaTypes.ObjectId,
            ref: 'Location',

        },
        locationDest: {
            type: SchemaTypes.ObjectId,
            ref: 'Location',
        },
        itemType: {
            type: String,
            enum: ['SpareParts', 'AssetModel'],
            required: true,
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
        unitPrice: {
            type: Number,
        },
        vatPercent: {
            type: Number,
            default: 0,
        },
        supplier: {
            type: String,
        },
    },
    {
        timestamps: true, // createdAt, updatedAt
    }
);

// Thêm plugin hỗ trợ toJSON và phân trang
StockMoveSchema.plugin(toJSON);
StockMoveSchema.plugin(paginate);

// Đăng ký model
const StockMove = mongoose.model('StockMove', StockMoveSchema);

module.exports = StockMove;

