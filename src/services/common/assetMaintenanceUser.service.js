const httpStatus = require('http-status');
const { AssetMaintenanceUserModel } = require('../../models');
const ApiError = require('../../utils/ApiError');

const createAssetMaintenanceUser = async (data) => {
    const { userId, assetMaintenances } = data;

    // Kiểm tra dữ liệu hợp lệ
    if (!userId || !Array.isArray(assetMaintenances)) {
        throw new Error("userId hoặc danh sách assetMaintenances không hợp lệ");
    }

    // Tạo danh sách để insert
    const insertData = assetMaintenances.map(assetMaintenanceId => ({
        user: userId,
        assetMaintenance: assetMaintenanceId,
    }));


    return AssetMaintenanceUserModel.insertMany(insertData);
};

const getAssetMaintenanceUserById = async (id) => {
    return AssetMaintenanceUserModel.findById(id);
};

const deleteAssetMaintenanceUserById = async (id) => {
    const asset = await getAssetMaintenanceUserById(id);
    if (!asset) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Asset not found');
    }
    await asset.remove();
    return asset;
};

const getAssetMaintenancesByUserId = async (userId) => {
    const records = await AssetMaintenanceUserModel.find({ user: userId })
        .populate({
            path: 'assetMaintenance',
            populate: [
                { path: 'asset' },
                { path: 'assetModel' },
            ]
        });

    return records;
};

const getUsersByAssetMaintenanceId = async (assetMaintenanceId) => {
    const records = await AssetMaintenanceUserModel.find({ assetMaintenance: assetMaintenanceId })
        .populate('user');
    return records;
};


module.exports = {
    createAssetMaintenanceUser,
    getAssetMaintenanceUserById,
    deleteAssetMaintenanceUserById,
    getAssetMaintenancesByUserId,
    getUsersByAssetMaintenanceId,
};
