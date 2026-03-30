const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const catchAsync = require('../../utils/catchAsync');
const { assetTypeCategoryService } = require('../../services');
const ApiError = require('../../utils/ApiError');

/**
 * Create a user
 * @type {(function(*, *, *): void)|*}
 */
const createAssetTypeCategory = catchAsync(async (req, res) => {
    req.body = {
        ...req.body,
        createdBy: req.user.id,
        updatedBy: req.user.id,
    };
    const assetTypeCategory = await assetTypeCategoryService.createAssetTypeCategory(req.body);
    res.status(httpStatus.CREATED).send({ code: 1, assetTypeCategory });
});
const getAssetTypeCategorys = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['name']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await assetTypeCategoryService.queryAssetTypeCategorys(filter, options);
    res.send({ results: result, code: 1 });
});

const getAssetTypeCategoryById = catchAsync(async (req, res) => {
    const assetTypeCategory = await assetTypeCategoryService.getAssetTypeCategoryById(req.query.id);
    if (!assetTypeCategory) {
        throw new ApiError(httpStatus.NOT_FOUND, 'assetTypeCategory not found');
    }
    res.send({ code: 1, data: assetTypeCategory });
});

/**
 * Update user by id.
 * @type {(function(*, *, *): void)|*}
 */
const updateAssetTypeCategory = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body.data;
    updateData.updatedBy = req.user.id;
    const updated = await assetTypeCategoryService.updateAssetTypeCategoryById(id, updateData);
    res.send({ code: 1, data: updated });
});

/**
 * Delete user by id.
 * @type {(function(*, *, *): void)|*}
 */
const deleteAssetTypeCategory = catchAsync(async (req, res) => {
    await assetTypeCategoryService.deleteAssetTypeCategoryById(req.query.id);
    res.status(httpStatus.OK).send({ code: 1 });
});

const updateStatus = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body.data;
    const updated = await assetTypeCategoryService.updateStatus(id, updateData);
    res.send({ code: 1, data: updated });
});

const getAllAssetTypeCategory = catchAsync(async (req, res) => {
    const assetTypes = await assetTypeCategoryService.getAllAssetTypeCategory();
    res.send({ code: 1, data: assetTypes });
});
module.exports = {
    createAssetTypeCategory,
    getAssetTypeCategorys,
    getAssetTypeCategoryById,
    updateAssetTypeCategory,
    deleteAssetTypeCategory,
    updateStatus,
    getAllAssetTypeCategory,
};
