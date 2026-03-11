const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const deviceLoginSchema = mongoose.Schema(
    {
        deviceLoginName: {
            type: String,
        },
        model: {
            type: String,
        },
        susbscriptionId: {
            type: String,
            required: true,
        },
        version: {
            type: String
        },
        major: {
            type: String
        },
        version: {
            type: String
        },
        endpoint: {
            type: String
        },
        expirationTime: {
            type: Date
        },
        p256dh: {
            type: String
        },
        auth: {
            type: String
        },
        user: {
            type: SchemaTypes.ObjectId,
            ref: 'User',
        }
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
deviceLoginSchema.plugin(toJSON);
deviceLoginSchema.plugin(paginate);

/**
 * @typedef User
 */
const DeviceLogin = mongoose.model('DeviceLogin', deviceLoginSchema);

module.exports = DeviceLogin;
