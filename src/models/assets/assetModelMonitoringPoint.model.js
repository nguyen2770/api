const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const assetModelMonitoringPointSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            index: true,
        },
        isMapping: {
            type: Boolean,
            default: false,
        },
        uomId: {
            type: SchemaTypes.ObjectId,
            ref: 'Uom',
            default: null,
        },
        assetModel: {
            type: SchemaTypes.ObjectId,
            ref: 'AssetModel',
            default: null,
        },
        duration: {
            type: Number,
        },
        frequencyType: {
            type: String,
            enum: ['daily', 'weekly', 'monthly', 'yearly', 'custom'],
        },
        initialValue: {
            type: Number,
            trim: true,
            default: 0,
        },
        monitoringPointsName: {
            type: String,
            trim: true,
        },
        sensorId: {
            type: SchemaTypes.ObjectId,
            ref: 'Sensor',
            default: null,
        },
        status: {
            type: Boolean,
            default: true, // true: active, false: inactive
        },
        measuringType: {
            type: String,
            enum: ['Incremental', 'Incidental'],
        },
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
assetModelMonitoringPointSchema.plugin(toJSON);
assetModelMonitoringPointSchema.plugin(paginate);

/**
 * @typedef User
 */
const AssetModelMonitoringPoint = mongoose.model(
    'AssetModelMonitoringPoint',
    assetModelMonitoringPointSchema
);

module.exports = AssetModelMonitoringPoint;
