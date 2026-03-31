const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const { assetMaintenanceAdditionalInfoService } = require('../../services');
const ApiError = require('../../utils/ApiError');

/**
 * Create a user
 * @type {(function(*, *, *): void)|*}
 */
const createAssetMaintenanceAdditionalInfo = catchAsync(async (req, res) => {
    req.body = {
        ...req.body,
        // createdBy: req.user.id,
        // updatedBy: req.user.id,
    };
    const asset = await assetMaintenanceAdditionalInfoService.createAssetMaintenanceAdditionalInfo(req.body);
    res.status(httpStatus.CREATED).send({ code: 1, asset });
});

const getAssetMaintenanceAdditionalInfoById = catchAsync(async (req, res) => {
    const asset = await assetMaintenanceAdditionalInfoService.getAssetMaintenanceAdditionalInfoById(req.query.id);
    if (!asset) {
        throw new ApiError(httpStatus.NOT_FOUND, 'category not found');
    }
    res.send({ code: 1, data: asset });
});

/**
 * Update user by id.
 * @type {(function(*, *, *): void)|*}
 */
const updateAssetMaintenanceAdditionalInfo = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body.data;
    // updateData.updatedBy = req.user.id; // Nếu cần
    const updated = await assetMaintenanceAdditionalInfoService.updateAssetMaintenanceAdditionalInfoById(id, updateData);
    res.send({ code: 1, data: updated });
});

/**
 * Delete user by id.
 * @type {(function(*, *, *): void)|*}
 */
const deleteAssetMaintenanceAdditionalInfo = catchAsync(async (req, res) => {
    await assetMaintenanceAdditionalInfoService.deleteAssetMaintenanceAdditionalInfoById(req.query.id);
    res.status(httpStatus.OK).send({ code: 1 });
});

const updateStatus = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body.data;
    const updated = await assetMaintenanceAdditionalInfoService.updateStatus(id, updateData);
    res.send({ code: 1, data: updated });
});

const getAllAssetMaintenanceAdditionalInfo = catchAsync(async (req, res) => {
    const assets = await assetMaintenanceAdditionalInfoService.getAllAssetMaintenanceAdditionalInfo();
    res.send({ code: 1, data: assets });
});

const getResById = catchAsync(async (req, res) => {
    const assets = await assetMaintenanceAdditionalInfoService.getResById(req.query.id);
    if (!assets) {
        throw new ApiError(httpStatus.NOT_FOUND, 'assetMaintenanceAdditionalInfoService not found');
    }
    res.send({ code: 1, data: assets });
});
module.exports = {
    createAssetMaintenanceAdditionalInfo,
    getAssetMaintenanceAdditionalInfoById,
    updateAssetMaintenanceAdditionalInfo,
    deleteAssetMaintenanceAdditionalInfo,
    updateStatus,
    getAllAssetMaintenanceAdditionalInfo,
    getResById,
};
