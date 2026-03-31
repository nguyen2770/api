const { AssetIdInfo } = require('../../models');

const deleteAssetIdInfoByAssetMaintenanceId = async (assetMaintenanceId) => {
    return AssetIdInfo.deleteMany({ assetMaintenanceId });
};
const getAssetInfoByAssetMaintenanceId = async (id) => {
    return AssetIdInfo.find({ assetMaintenanceId: id }).populate({
        path: 'createdBy',
        select: 'username',
    });
};
const getAssetInfoByAssetId = async (id) => {
    return AssetIdInfo.find({ assetId: id });
};
const getAssetInfoByQrCode = async (id) => {
    return AssetIdInfo.find({ qrCode: id });
};
const getAssetIdInfoById = async (id) => {
    return AssetIdInfo.findById(id);
};
const createAssetIdInfo = async (assetIdInfoBody) => {
    return AssetIdInfo.create(assetIdInfoBody);
};
const updateAssetIdInfoById = async (id, assetIdInfoBody) => {
    const assetIdInfo = await getAssetIdInfoById(id);
    if (!assetIdInfo) {
        throw new Error('AssetIdInfo not found');
    }
    Object.assign(assetIdInfo, assetIdInfoBody);
    await assetIdInfo.save();
    return assetIdInfo;
};
const updateStatus = async (id, status) => {
    const assetIdInfo = await getAssetIdInfoById(id);
    if (!assetIdInfo) {
        throw new Error('AssetIdInfo not found');
    }
    assetIdInfo.status = status;
    await assetIdInfo.save();
    return assetIdInfo;
};

const deleteAssetIdInfoById = async (id) => {
    const assetIdInfo = await getAssetIdInfoById(id);
    if (!assetIdInfo) {
        throw new Error('AssetIdInfo not found');
    }
    await assetIdInfo.remove();
    return assetIdInfo;
};

module.exports = {
    deleteAssetIdInfoByAssetMaintenanceId,
    getAssetInfoByAssetMaintenanceId,
    getAssetIdInfoById,
    createAssetIdInfo,
    updateAssetIdInfoById,
    deleteAssetIdInfoById,
    updateStatus,
    getAssetInfoByAssetId,
    getAssetInfoByQrCode,
};
