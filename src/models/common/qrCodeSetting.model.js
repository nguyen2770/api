const mongoose = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const qrCodeSettingSchema = mongoose.Schema(
    {
        propertyName: {
            type: String,
        },
        sortIndex: {
            type: Number
        }
    },
    {
        timestamps: true,
    }
);
// add plugin that converts mongoose to json
qrCodeSettingSchema.plugin(toJSON);
qrCodeSettingSchema.plugin(paginate);

/**
 * @typedef User
 */
const QrCodeSetting = mongoose.model('QrCodeSetting', qrCodeSettingSchema);

module.exports = QrCodeSetting;
