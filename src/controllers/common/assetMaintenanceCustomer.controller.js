const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const { assetMaintenanceCustomerService, assetMaintenanceService } = require('../../services');
const ApiError = require('../../utils/ApiError');
const pick = require('../../utils/pick');

const createAssetMaintenanceCustomer = catchAsync(async (req, res) => {
    await assetMaintenanceCustomerService.createAssetMaintenanceCustomer(req.body);
    res.status(httpStatus.OK).send({ code: 1 })
});

const getMaintenances = catchAsync(async (req, res) => {
    const customerId = req.query.id;
    const maintenances = await assetMaintenanceCustomerService.getMaintenances(customerId);
    res.send({ code: 1, data: maintenances });
});

const deleteAssetMaintenanceCustomer = catchAsync(async (req, res) => {
    await assetMaintenanceCustomerService.deleteAssetMaintenanceCustomerById(req.query.id);
    res.status(httpStatus.OK).send({ code: 1 });
});

const getUnassignedAssetMaintenancesByCustomerId = catchAsync(async (req, res) => {
    const customerId = req.query.id;
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

    if (!customerId) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Missing userId');
    }

    const combinedFilter = {
        ...baseFilter,
        customer: null
    }
    const unassignedAssets = await assetMaintenanceService.queryAssetMaintenances(combinedFilter, options);
    res.status(httpStatus.OK).send({ code: 1, data: unassignedAssets });
});

module.exports = {
    createAssetMaintenanceCustomer,
    getMaintenances,
    deleteAssetMaintenanceCustomer,
    getUnassignedAssetMaintenancesByCustomerId
};