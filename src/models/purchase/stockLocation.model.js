const mongoose = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const { SchemaTypes } = mongoose;

const StockLocationSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        usage: {
            type: String,
            enum: ['VIRTUAL', 'INTERNAL',],
            default: "INTERNAL",
        },
        active: {
            type: Boolean,
            default: true,
        },
        code: {
            type: String,
        },
        address: {
            type: String,
        },
        province: {
            type: SchemaTypes.ObjectId,
            ref: 'Province',
        },
        commune: {
            type: SchemaTypes.ObjectId,
            ref: 'Commune',
        },
        createdBy: {
            type: SchemaTypes.ObjectId,
            ref: 'User',
        },
        updatedBy: {
            type: SchemaTypes.ObjectId,
            ref: 'User',
        }
    },
    {
        timestamps: true, // createdAt, updatedAt
    }
);

// Thêm plugin hỗ trợ toJSON và phân trang
StockLocationSchema.plugin(toJSON);
StockLocationSchema.plugin(paginate);

// Đăng ký model
const StockLocation = mongoose.model('StockLocation', StockLocationSchema);

module.exports = StockLocation;

