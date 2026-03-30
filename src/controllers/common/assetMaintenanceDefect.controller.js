const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const { assetMaintenanceDefectService } = require('../../services');
const ApiError = require('../../utils/ApiError');

/**
 * Create a user
 * @type {(function(*, *, *): void)|*}
 */
const createAssetMaintenanceDefect = catchAsync(async (req, res) => {
    req.body = {
        ...req.body,
        // createdBy: req.user.id,
        // updatedBy: req.user.id,
    };
    const asset = await assetMaintenanceDefectService.createAssetMaintenanceDefect(req.body);
    res.status(httpStatus.CREATED).send({ code: 1, asset });
});

const getAssetMaintenanceDefectById = catchAsync(async (req, res) => {
    const asset = await assetMaintenanceDefectService.getAssetMaintenanceDefectById(req.query.id);
    if (!asset) {
        throw new ApiError(httpStatus.NOT_FOUND, 'assetMaintenanceDefectService not found');
    }
    res.send({ code: 1, data: asset });
});

/**
 * Update user by id.
 * @type {(function(*, *, *): void)|*}
 */
const updateAssetMaintenanceDefect = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body.data;
    // updateData.updatedBy = req.user.id; // Nếu cần
    const updated = await assetMaintenanceDefectService.updateAssetMaintenanceDefectById(id, updateData);
    res.send({ code: 1, data: updated });
});

/**
 * Delete user by id.
 * @type {(function(*, *, *): void)|*}
 */
const deleteAssetMaintenanceDefect = catchAsync(async (req, res) => {
    await assetMaintenanceDefectService.deleteAssetMaintenanceDefectById(req.query.id);
    res.status(httpStatus.OK).send({ code: 1 });
});

const updateStatus = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body.data;
    const updated = await assetMaintenanceDefectService.updateStatus(id, updateData);
    res.send({ code: 1, data: updated });
});

const getAllAssetMaintenanceDefect = catchAsync(async (req, res) => {
    const assets = await assetMaintenanceDefectService.getAllAssetMaintenanceDefect();
    res.send({ code: 1, data: assets });
});

const getResById = catchAsync(async (req, res) => {
    const assets = await assetMaintenanceDefectService.getResById(req.query.id);
    if (!assets) {
        throw new ApiError(httpStatus.NOT_FOUND, 'assetMaintenanceDefectService not found');
    }
    res.send({ code: 1, data: assets });
});
module.exports = {
    createAssetMaintenanceDefect,
    getAssetMaintenanceDefectById,
    updateAssetMaintenanceDefect,
    deleteAssetMaintenanceDefect,
    updateStatus,
    getAllAssetMaintenanceDefect,
    getResById,
};
