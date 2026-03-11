const mongoose = require('mongoose');
const { toJSON, paginate } = require('../plugins');
const { tokenTypes } = require('../../config/tokens');

const { SchemaTypes } = mongoose;

const deviceMobileSchema = mongoose.Schema(
    {
        deviceToken: {
            type: String,
            required: true,
        },
        deviceName: {
            type: String,
        },
        deviceType: {
            type: String,
        },
        deviceModelName: {
            type: String,
        },
        deviceManufacturerName: {
            type: String,
        },
        user: {
            type: SchemaTypes.ObjectId,
            ref: 'User',
        },
        modelId: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
deviceMobileSchema.plugin(toJSON);
deviceMobileSchema.plugin(paginate);
const DeviceMobile = mongoose.model('DeviceMobile', deviceMobileSchema);

module.exports = DeviceMobile;
