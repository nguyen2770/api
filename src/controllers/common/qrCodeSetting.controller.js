const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const catchAsync = require('../../utils/catchAsync');
const qrCodeSettingService = require('../../services/common/qrCodeSetting.service')
const ApiError = require('../../utils/ApiError');

const getQrCodeSettings = catchAsync(async (req, res) => {
    const qCodeSettings = await qrCodeSettingService.getQrCodeSettings();
    res.send({ code: 1, data: qCodeSettings });
});



module.exports = {
    getQrCodeSettings
};