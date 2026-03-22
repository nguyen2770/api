const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const repairContractSparePartSchema = mongoose.Schema(
    {
        repairContract: {
            type: SchemaTypes.ObjectId,
            ref: 'RepairContract',
            default: null,
        },
        sparePart: {
            type: SchemaTypes.ObjectId,
            ref: 'SpareParts',
            default: null,
        },
        createdBy: {
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
repairContractSparePartSchema.plugin(toJSON);
repairContractSparePartSchema.plugin(paginate);

/**
 * @typedef User
 */
const RepairContractSparePart = mongoose.model('RepairContractSparePart', repairContractSparePartSchema);

module.exports = RepairContractSparePart;
