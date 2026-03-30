const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const userSpareStockSchema = mongoose.Schema(
    {
        userId: {
            type: String, 
            trim: true,
         
        },
        reorderStock: {
            type: Number, 
            default: 0,
        },
        spareParts_price: {
            type: String, 
            trim: true,
        },
        stock: {
            type: Number, 
            default: 0,
        },
        trans_price: {
            type: String, 
            trim: true,
        },
        sparePartId: {
            type: SchemaTypes.ObjectId, 
            ref: 'SpareParts', 

        },
    },
    {
        timestamps: true, 
    }
);

// add plugin that converts mongoose to json
userSpareStockSchema.plugin(toJSON);
userSpareStockSchema.plugin(paginate);

/**
 * @typedef UserSpareStock
 */
const UserSpareStock = mongoose.model('UserSpareStock', userSpareStockSchema);

module.exports = UserSpareStock;