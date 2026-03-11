const mongoose = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const notificationSchema = mongoose.Schema(
    {
        name: {
            type: String,
            default: null,
        },
        code: {
            type: String,
        },
        // icon base64
        icon: {
            type: String,
        },
        notificationType: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'NotificationType',
        },
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
notificationSchema.plugin(toJSON);
notificationSchema.plugin(paginate);

/**
 * @typedef User
 */
const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
