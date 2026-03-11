const mongoose = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const notificationUserSchema = mongoose.Schema(
    {
        title: {
            type: String,
            default: null,
        },
        text: {
            type: String,
        },
        notification: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Notification',
        },
        notificationType: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'NotificationType',
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        viewTime: {
            type: Date,
        },
        icon: {
            type: String,
        },
        image: {
            type: String,
        },
        tag: {
            type: String,
        },
        url: {
            type: String,
        },
        subUrl: {
            type: String,
        },
        webUrl: {
            type: String,
        },
        webSubUrl: {
            type: String,
        },
        isHidden: {
            type: Boolean,
            default: false,
        },
        isOpen: {
            type: Boolean,
            default: false,
        },
        numberOfTimesNotified: {
            type: Number,
        },
        origin: {
            type: mongoose.Schema.Types.ObjectId,
        },
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
notificationUserSchema.plugin(toJSON);
notificationUserSchema.plugin(paginate);

/**
 * @typedef User
 */
const NotificationUser = mongoose.model('NotificationUser', notificationUserSchema);

module.exports = NotificationUser;
