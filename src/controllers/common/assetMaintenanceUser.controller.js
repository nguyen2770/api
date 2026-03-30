const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const { assetMaintenanceUserService, assetMaintenanceService } = require('../../services');
const ApiError = require('../../utils/ApiError');
const pick = require('../../utils/pick');

/**
 * Create a user
 * @type {(function(*, *, *): void)|*}
 */
const createAssetMaintenanceUser = catchAsync(async (req, res) => {
   
    const asset = await assetMaintenanceUserService.createAssetMaintenanceUser(req.body);
    res.status(httpStatus.CREATED).send({ code: 1, asset });
});

const getAssetMaintenanceUserById = catchAsync(async (req, res) => {
    const asset = await assetMaintenanceUserService.getAssetMaintenanceUserById(req.query.id);
    if (!asset) {
        throw new ApiError(httpStatus.NOT_FOUND, 'assetMaintenanceUserService not found');
    }
    res.send({ code: 1, data: asset });
});


const deleteAssetMaintenanceUser = catchAsync(async (req, res) => {
    await assetMaintenanceUserService.deleteAssetMaintenanceUserById(req.query.id);
    res.status(httpStatus.OK).send({ code: 1 });
});

const getAssetMaintenancesByUserId = catchAsync(async (req, res) => {
    const assets = await assetMaintenanceUserService.getAssetMaintenancesByUserId(req.query.id);
    res.send({ code: 1, data: assets });
});

const getUsersByAssetMaintenanceId = catchAsync(async (req, res) => {
    const user = await assetMaintenanceUserService.getUsersByAssetMaintenanceId(req.query.id);
    res.send({ code: 1, data: user });
});

const getUnassignedAssetMaintenancesByUserId = catchAsync(async (req, res) => {
    const userId = req.query.id;
    const baseFilter = pick(req.query, [
        'serial',
        'assetModel',
        'customer',
        'asset',
        'qrCode',
        'manufacturer',
        'category',
        'subCategory',
        'assetStyle',
        'assetNumber'
    ]);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);

    if (!userId) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Missing userId');
    }

    // Lấy tất cả assetMaintenance đã gán cho user
    const assignedRecords = await assetMaintenanceUserService.getAssetMaintenancesByUserId(userId);
    const assignedIds = assignedRecords
        .map((record) => record.assetMaintenance.id || record.assetMaintenance)
        .filter(Boolean);

    // Kết hợp bộ lọc cơ bản với loại trừ các assetMaintenance đã được gán
    const combinedFilter = {
        ...baseFilter,
        _id: { $nin: assignedIds },
    };

    const unassignedAssets = await assetMaintenanceService.queryAssetMaintenances(combinedFilter, options);

    res.send({ code: 1, data: unassignedAssets });
});




module.exports = {
    createAssetMaintenanceUser,
    getAssetMaintenanceUserById,
    deleteAssetMaintenanceUser,
    getAssetMaintenancesByUserId,
    getUsersByAssetMaintenanceId,
    getUnassignedAssetMaintenancesByUserId
};
