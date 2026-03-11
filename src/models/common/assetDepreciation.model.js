const mongoose = require('mongoose');
const { toJSON, paginate } = require('../plugins');
const preRemoveHook = require('../../utils/preRemoveHook');
const buildRefsToSchema = require('../../utils/buildRefsToSchema');


const assetDepreciationSchema = new mongoose.Schema(
    {
        assetMaintenance: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'AssetMaintenance',
        },
        date: {
            type: Date
        },
        type: {
            type: String,
            required: true,
            enum: ['straightLine', 'doubleDecliningBalance', 'unitOfProductionDepreciationMethod', 'sumOfTheYearsDigitsDepreciationMethod'],
        },
        base: {
            type: String,
            required: true,
            enum: ['lifespan', 'percentage'],
        },
        value: {
            type: Number,
            default: 0,
            min: 0
        },
        accumulatedDepreciation: {
            type: Number,
            default: 0,
            min: 0
        },
        bookValue: {
            type: Number,
            default: 0,
            min: 0
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }, { timestamps: true }
);

// add plugin that converts mongoose to json
assetDepreciationSchema.plugin(toJSON);
assetDepreciationSchema.plugin(paginate);

assetDepreciationSchema.pre('remove', preRemoveHook(buildRefsToSchema('AssetDepreciation')));


const AssetDepreciation = mongoose.model('AssetDepreciation', assetDepreciationSchema)

module.exports = AssetDepreciation;
