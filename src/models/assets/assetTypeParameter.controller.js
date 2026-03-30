const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const catchAsync = require('../../utils/catchAsync');
const { assetTypeParameterService } = require('../../services');
const ApiError = require('../../utils/ApiError');

/**
 * Create a user
 * @type {(function(*, *, *): void)|*}
 */
const createAssetTypeParameter = catchAsync(async (req, res) => {
    req.body = {
        ...req.body,
        createdBy: req.user.id,
        updatedBy: req.user.id,
    };
    const assetTypeParameter = await assetTypeParameterService.createAssetTypeParameter(req.body);
    res.status(httpStatus.CREATED).send({ code: 1, assetTypeParameter });
});
const getAssetTypeParameters = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['assetType']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await assetTypeParameterService.queryAssetTypeParameters(filter, options);
    res.send({ results: result, code: 1 });
});

const getAssetTypeParameterById = catchAsync(async (req, res) => {
    const assetTypeParameter = await assetTypeParameterService.getAssetTypeParameterById(req.query.id);
    if (!assetTypeParameter) {
        throw new ApiError(httpStatus.NOT_FOUND, 'category not found');
    }
    res.send(assetTypeParameter);
});

/**
 * Update user by id.
 * @type {(function(*, *, *): void)|*}
 */
const updateAssetTypeParameter = catchAsync(async (req, res) => {
    const updated = await assetTypeParameterService.updateAssetTypeParameterById(req.params.id, req.body);
    res.send({ code: 1, data: updated });
});

/**
 * Delete user by id.
 * @type {(function(*, *, *): void)|*}
 */
const deleteAssetTypeParameter = catchAsync(async (req, res) => {
    await assetTypeParameterService.deleteAssetTypeParameterById(req.query.id);
    res.status(httpStatus.OK).send({ code: 1 });
});

const getAllAssetTypeParameter = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['assetType']);
    const assetTypeParameters = await assetTypeParameterService.getAllAssetTypeParameter(filter);
    res.send({ code: 1, data: assetTypeParameters });
});
module.exports = {
    createAssetTypeParameter,
    getAssetTypeParameters,
    getAssetTypeParameterById,
    updateAssetTypeParameter,
    deleteAssetTypeParameter,
    getAllAssetTypeParameter,
};
