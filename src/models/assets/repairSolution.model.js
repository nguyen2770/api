const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const repairSolutionSchema = mongoose.Schema(
    {
        assetModel: {
            type: SchemaTypes.ObjectId,
            ref: 'AssetModel',
            default: null,
        },
        assetMaintenanceDefect: {
            type: SchemaTypes.ObjectId,
            ref: 'AssetMaintenanceDefect',
            default: null,
        },
        name: {
            type: String,
        },
        content: {
            type: String,
        },
        status: {
            type: Boolean,
            default: true,
            required: true
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
        }
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
repairSolutionSchema.plugin(toJSON);
repairSolutionSchema.plugin(paginate);

/**
 * @typedef User
 */
const RepairSolution = mongoose.model('RepairSolution', repairSolutionSchema);

module.exports = RepairSolution;
