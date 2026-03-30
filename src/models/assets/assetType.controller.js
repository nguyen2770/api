const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const catchAsync = require('../../utils/catchAsync');
const { assetTypeService } = require('../../services');
const ApiError = require('../../utils/ApiError');

/**
 * Create a user
 * @type {(function(*, *, *): void)|*}
 */
const createAssetType = catchAsync(async (req, res) => {
    req.body = {
        ...req.body,
        createdBy: req.user.id,
        updatedBy: req.user.id,
    };
    const assetType = await assetTypeService.createAssetType(req.body);
    res.status(httpStatus.CREATED).send({ code: 1, assetType });
});
const getAssetTypes = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['expectedPrice', 'asset', 'assetTypeCategory', 'expectedPriceTo', 'expectedPriceFrom']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await assetTypeService.queryAssetTypes(filter, options);
    // exchangeRequests.abc = 123;
    res.send({ results: result, code: 1 });
});

const getAssetTypeById = catchAsync(async (req, res) => {
    const assetType = await assetTypeService.getAssetTypeById(req.query.id);
    if (!assetType) {
        throw new ApiError(httpStatus.NOT_FOUND, 'category not found');
    }
    res.send({code: 1, assetType});
});

/**
 * Update user by id.
 * @type {(function(*, *, *): void)|*}
 */
const updateAssetType = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body.data;
    // updateData.updatedBy = req.user.id; // Nếu cần
    const updated = await assetTypeService.updateAssetTypeById(id, updateData);
    res.send({ code: 1, data: updated });
});

/**
 * Delete user by id.
 * @type {(function(*, *, *): void)|*}
 */
const deleteAssetType = catchAsync(async (req, res) => {
    await assetTypeService.deleteAssetTypeById(req.query.id);
    res.status(httpStatus.OK).send({ code: 1 });
});

const updateStatus = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body.data;
    const updated = await assetTypeService.updateStatus(id, updateData);
    res.send({ code: 1, data: updated });
});

const getAllAssetType = catchAsync(async (req, res) => {
    const assetTypes = await assetTypeService.getAllAssetType();
    res.send({ code: 1, data: assetTypes });
});

const getAllAssetTypeByAsset = catchAsync(async (req, res) => {
    const assetTypes = await assetTypeService.getAllAssetTypeByAsset(req.query.asset);
    res.send({ code: 1, data: assetTypes });
});
module.exports = {
    createAssetType,
    getAssetTypes,
    getAssetTypeById,
    updateAssetType,
    deleteAssetType,
    updateStatus,
    getAllAssetType,
    getAllAssetTypeByAsset
};
