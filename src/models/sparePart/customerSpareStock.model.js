const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const customerSpareStockSchema = mongoose.Schema(
    {
        customerId: {
            type: SchemaTypes.ObjectId,
            ref: 'Customer',
        },
        spareParts_price: {
            type: String,
            trim: true,
        },
        trans_price: {
            type: String,
            trim: true,
        },
        stock: {
            type: Number,
            default: 0,
        },
        reorderStock: {
            type: String,
            trim: true,
        },
        sparePartId: {
            type: SchemaTypes.ObjectId,

        },
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
customerSpareStockSchema.plugin(toJSON);
customerSpareStockSchema.plugin(paginate);

/**
 * @typedef CustomerSpareStock
 */
const CustomerSpareStock = mongoose.model('CustomerSpareStock', customerSpareStockSchema);

module.exports = CustomerSpareStock;