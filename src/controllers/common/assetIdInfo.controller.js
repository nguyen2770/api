const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const { assetIdInfoService } = require('../../services');
const ApiError = require('../../utils/ApiError');

const createAssetIdInfo = catchAsync(async (req, res) => {
    const data = {
        ...req.body,
        // createdBy: req.user.id,
        // updatedBy: req.user.id,
    };
    const existed = await assetIdInfoService.getAssetInfoByAssetId(data.assetId);
    if (existed && existed.length > 0) {
        return res.status(httpStatus.CREATED).send({ code: 0, message: 'Asset ID đã tồn tại' });
    }
    const existedQrCode = await assetIdInfoService.getAssetInfoByQrCode(data.qrCode);
    if (existedQrCode && existedQrCode.length > 0) {
        return res.status(httpStatus.CREATED).send({ code: 0, message: 'QR Code đã tồn tại' });
    }
    const assetIdInfo = await assetIdInfoService.createAssetIdInfo(data);
    res.status(httpStatus.CREATED).send({ code: 1, assetIdInfo });
});

const getAssetIdInfoById = catchAsync(async (req, res) => {
    const assetIdInfo = await assetIdInfoService.getAssetIdInfoById(req.query.id);
    if (!assetIdInfo) {
        throw new ApiError(httpStatus.NOT_FOUND, 'assetIdInfoService not found');
    }
    res.send({ code: 1, data: assetIdInfo });
});
const getAssetInfoByAssetMaintenanceId = catchAsync(async (req, res) => {
    const assetIdInfos = await assetIdInfoService.getAssetInfoByAssetMaintenanceId(req.query.id);
    if (!assetIdInfos) {
        throw new ApiError(httpStatus.NOT_FOUND, 'assetIdInfoService not found');
    }
    res.send({ code: 1, data: assetIdInfos });
});
/**
 * Update user by id.
 * @type {(function(*, *, *): void)|*}
 */
const updateAssetIdInfo = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body.assetIdInfo;
    // updateData.updatedBy = req.user.id; // Nếu cần
    const oldAssetIdInfo = await assetIdInfoService.getAssetIdInfoById(id);
    const existed = await assetIdInfoService.getAssetInfoByAssetId(updateData.assetId);
    if (existed && existed.length > 0 && oldAssetIdInfo.assetId !== updateData.assetId) {
        return res.status(httpStatus.CREATED).send({ code: 0, message: 'Asset ID đã tồn tại' });
    }
    const existedQrCode = await assetIdInfoService.getAssetInfoByQrCode(updateData.qrCode);
    if (existedQrCode && existedQrCode.length > 0 && oldAssetIdInfo.qrCode !== updateData.qrCode) {
        return res.status(httpStatus.CREATED).send({ code: 0, message: 'QR Code đã tồn tại' });
    }
    const updated = await assetIdInfoService.updateAssetIdInfoById(id, updateData);
    res.send({ code: 1, data: updated });
});

/**
 * Delete user by id.
 * @type {(function(*, *, *): void)|*}
 */
const deleteAssetIdInfo = catchAsync(async (req, res) => {
    await assetIdInfoService.deleteAssetIdInfoById(req.query.id);
    res.status(httpStatus.OK).send({ code: 1 });
});

const updateStatus = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body.assetIdInfo;
    const updated = await assetIdInfoService.updateStatus(id, updateData.status);
    res.send({ code: 1, data: updated });
});

module.exports = {
    createAssetIdInfo,
    getAssetIdInfoById,
    updateAssetIdInfo,
    deleteAssetIdInfo,
    updateStatus,
    getAssetInfoByAssetMaintenanceId,
};
