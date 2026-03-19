const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const { assetModelMonitoringPointService } = require('../../services');
const ApiError = require('../../utils/ApiError');

/**
 * Create a user
 * @type {(function(*, *, *): void)|*}
 */
const createAssetModelMonioringPoint = catchAsync(async (req, res) => {
    req.body = {
        ...req.body,
        // createdBy: req.user.id,
        // updatedBy: req.user.id,
    };
    const asset = await assetModelMonitoringPointService.createAssetModelMonioringPoint(req.body);
    res.status(httpStatus.CREATED).send({ code: 1, asset });
});

const getAssetModelMonioringPointById = catchAsync(async (req, res) => {
    const asset = await assetModelMonitoringPointService.getAssetModelMonitoringPoinById(req.query.id);
    if (!asset) {
        throw new ApiError(httpStatus.NOT_FOUND, 'category not found');
    }
    res.send({ code: 1, data: asset });
});

/**
 * Update user by id.
 * @type {(function(*, *, *): void)|*}
 */
const updateAssetModelMonioringPoint = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body.data;
    // updateData.updatedBy = req.user.id; // Nếu cần
    const updated = await assetModelMonitoringPointService.updateAssetModelMonitoringPoinById(id, updateData);
    res.send({ code: 1, data: updated });
});

/**
 * Delete user by id.
 * @type {(function(*, *, *): void)|*}
 */
const deleteAssetModelMonioringPoint = catchAsync(async (req, res) => {
    await assetModelMonitoringPointService.deleteAssetModelMonitoringPoinById(req.query.id);
    res.status(httpStatus.OK).send({ code: 1 });
});

const updateStatus = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body.data;
    const updated = await assetModelMonitoringPointService.updateStatus(id, updateData);
    res.send({ code: 1, data: updated });
});

const getAllAssetModelMonitoringPoint = catchAsync(async (req, res) => {
    const assetModelMonitoringPoints =
        await assetModelMonitoringPointService.getAllAssetModelMonitoringPoint();
    res.send({ code: 1, data: assetModelMonitoringPoints });
});

const getResById = catchAsync(async (req, res) => {
    const assetModelMonitoringPoints = await assetModelMonitoringPointService.getResById(req.query.assetModelId);
    if (!assetModelMonitoringPoints) {
        throw new ApiError(httpStatus.NOT_FOUND, 'assetModelMonitoringPoints not found');
    }
    res.send({ code: 1, data: assetModelMonitoringPoints });
});
module.exports = {
    createAssetModelMonioringPoint,
    getAssetModelMonioringPointById,
    updateAssetModelMonioringPoint,
    deleteAssetModelMonioringPoint,
    updateStatus,
    getAllAssetModelMonitoringPoint,
    getResById,
};
