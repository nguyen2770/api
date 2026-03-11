const mongoose = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const notificationTypeSchema = mongoose.Schema(
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
        users: {
            type: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                },
            ],
            default: [],
        },
        advanceNoticeDays: {
            type: Number,
            default: 0,
        },
        advanceNoticeType: {
            type: String,
            enum: ['day', 'hour', 'minute'],
            default: 'minute',
        },
        isPriorNoticeRequired: {
            // có cần nhập số ngày thông báo không
            type: Boolean,
            default: false,
        },
        isNotifyTheManager: {
            // có cần nhập người thông báo không
            type: Boolean,
            default: false,
        },
        numberOfNotification: {
            type: Number,
            default: 1,
        },
        isNumberOfNotification: {
            type: Boolean,
        },
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
notificationTypeSchema.plugin(toJSON);
notificationTypeSchema.plugin(paginate);

/**
 * @typedef User
 */
const NotificationType = mongoose.model('NotificationType', notificationTypeSchema);

module.exports = NotificationType;
