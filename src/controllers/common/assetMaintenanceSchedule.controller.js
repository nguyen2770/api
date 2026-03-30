const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const { assetMaintenanceScheduleService } = require('../../services');
const ApiError = require('../../utils/ApiError');

/**
 * Create a user
 * @type {(function(*, *, *): void)|*}
 */
const createAssetMaintenanceSchedule = catchAsync(async (req, res) => {
    const data = {
        ...req.body,
        // createdBy: req.user.id,
        // updatedBy: req.user.id,
    };
    const asset = await assetMaintenanceScheduleService.createAssetMaintenanceSchedule(data);
    res.status(httpStatus.CREATED).send({ code: 1, data: asset });
});

const getAssetMaintenanceScheduleById = catchAsync(async (req, res) => {
    const asset = await assetMaintenanceScheduleService.getAssetMaintenanceScheduleById(req.query.id);
    if (!asset) {
        throw new ApiError(httpStatus.NOT_FOUND, 'assetMaintenanceScheduleService not found');
    }
    res.send({ code: 1, data: asset });
});

/**
 * Update user by id.
 * @type {(function(*, *, *): void)|*}
 */
const updateAssetMaintenanceSchedule = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body.data;
    // updateData.updatedBy = req.user.id; // Nếu cần
    const updated = await assetMaintenanceScheduleService.updateAssetMaintenanceScheduleById(id, updateData);
    res.send({ code: 1, data: updated });
});

/**
 * Delete user by id.
 * @type {(function(*, *, *): void)|*}
 */
const deleteAssetMaintenanceSchedule = catchAsync(async (req, res) => {
    await assetMaintenanceScheduleService.deleteAssetMaintenanceScheduleById(req.query.id);
    res.status(httpStatus.OK).send({ code: 1 });
});


const getAllAssetMaintenanceSchedule = catchAsync(async (req, res) => {
    const assets = await assetMaintenanceScheduleService.getAllAssetMaintenanceSchedule();
    res.send({ code: 1, data: assets });
});

const getResById = catchAsync(async (req, res) => {
    const { id, search } = req.query;
    const results = await assetMaintenanceScheduleService.getResById(id, search);
    res.send({ code: 1, data: results });
});

module.exports = {
    createAssetMaintenanceSchedule,
    getAssetMaintenanceScheduleById,
    updateAssetMaintenanceSchedule,
    deleteAssetMaintenanceSchedule,
    getAllAssetMaintenanceSchedule,
    getResById,
};
