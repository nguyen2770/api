const { AssetMaintenance } = require("../models");

/**
 * @param {Model} DBModel - Model của bảng cần thay đổi (SchedulePreventive, CalibrationWork)
 * @param {string} amId - ID của AssetMaintenance
 * @param {Object} newData - Dữ liệu mới từ Request (body)
 * @param {Function} onFieldsChanged - Callback xử lý bảng liên quan
 */
const syncLocationData = async (amId, newData, onFieldsChanged) => {
    const oldData = await AssetMaintenance.findById(amId);
    if (!oldData) {
        throw new Error("Không tìm thấy AssetMaintenance này");
    }
    const fieldsToWatch = ['province', 'commune', 'branch', 'building', 'floor', 'department', 'addressNote'];
    const isChanged = fieldsToWatch.some(field => {
        const oldVal = oldData[field] ? oldData[field].toString() : "";
        const newVal = newData[field] ? newData[field].toString() : "";
        // console.log(oldVal + " " + newVal);
        return oldVal !== newVal;
    });

    if (isChanged) {
        await onFieldsChanged(oldData, newData);
    }
};
module.exports = {
    syncLocationData
};