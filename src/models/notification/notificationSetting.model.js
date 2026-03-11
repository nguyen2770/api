const mongoose = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const notificationSettingSchema = mongoose.Schema(
    {
        company: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'Company',
            default: null,
        },
        preInspectionNotificationDays: {
            type: Number,
            default: 5,
        },
       
    },
    {
        timestamps: true,
    }
);
// add plugin that converts mongoose to json
notificationSettingSchema.plugin(toJSON);
notificationSettingSchema.plugin(paginate);

/**
 * @typedef User
 */
const NotificationSetting = mongoose.model('NotificationSetting', notificationSettingSchema);

module.exports = NotificationSetting;
