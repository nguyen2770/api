const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const catchAsync = require('../../utils/catchAsync');
const { assetService } = require('../../services');
const ApiError = require('../../utils/ApiError');

/**
 * Create a user
 * @type {(function(*, *, *): void)|*}
 */
const createAsset = catchAsync(async (req, res) => {
    req.body = {
        ...req.body.asset,
        createdBy: req.user.id,
        // updatedBy: req.user.id,
    };
    const asset = await assetService.createAsset(req.body);
    res.status(httpStatus.CREATED).send({ code: 1, asset });
});
const getAssets = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['category', 'subCategory', 'assetType', 'manufacturer', 'assetName', 'symbol']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await assetService.queryAssets(filter, options);
    const assets = [];
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < result.results.length; i++) {
        const element = result.results[i].toObject();
        // eslint-disable-next-line no-await-in-loop
        // eslint-disable-next-line no-await-in-loop
        element.id = element._id;
        assets.push(element);
    }
    // exchangeRequests.abc = 123;
    res.send({ code: 1, results: { ...result, results: assets } });
});

const getAssetById = catchAsync(async (req, res) => {
    const asset = await assetService.getAssetById(req.query.id);
    if (!asset) {
        throw new ApiError(httpStatus.NOT_FOUND, 'category not found');
    }
    res.send({
        ...(asset.toObject() ? asset.toObject() : asset),
        code: 1,
    });
});

/**
 * Update user by id.
 * @type {(function(*, *, *): void)|*}
 */
const updateAsset = catchAsync(async (req, res) => {
    const { id, asset } = req.body;
    // updateData.updatedBy = req.user.id; // Nếu cần
    const updated = await assetService.updateAssetById(id, asset);
    res.send({ code: 1, data: updated });
});

/**
 * Delete user by id.
 * @type {(function(*, *, *): void)|*}
 */
const deleteAsset = catchAsync(async (req, res) => {
    await assetService.deleteAssetById(req.query.id);
    res.status(httpStatus.OK).send({ code: 1 });
});

const updateStatus = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body.asset;
    const updated = await assetService.updateStatus(id, updateData);
    res.send({ code: 1, data: updated });
});

const getAllAsset = catchAsync(async (req, res) => {
    const categories = await assetService.getAllAsset();
    res.send({ code: 1, data: categories });
});
const getAssetByRes = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['category', 'subCategory', 'assetType', 'manufacturer', 'assetId']);

    const assets = await assetService.getAssetByRes(filter);
    res.send({ code: 1, data: assets });
});
module.exports = {
    createAsset,
    getAssets,
    getAssetById,
    updateAsset,
    deleteAsset,
    updateStatus,
    getAllAsset,
    getAssetByRes,
};
