const httpStatus = require('http-status');
const QrCodeSettingModel = require('../../models/common/qrCodeSetting.model');
const ApiError = require('../../utils/ApiError');

// const updateBranchById = async (id, branch) => {
//     const a = await Branch.findByIdAndUpdate(id, branch)
//     return a;
// }
const getQrCodeSettings = async () => {
    const qrCodeSettings = await QrCodeSettingModel.find();
    return qrCodeSettings;
}


module.exports = {
    getQrCodeSettings
}