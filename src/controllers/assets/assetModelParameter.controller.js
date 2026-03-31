const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const catchAsync = require('../../utils/catchAsync');
const { assetModelParameterService } = require('../../services');
const ApiError = require('../../utils/ApiError');

/**
 * Create a user
 * @type {(function(*, *, *): void)|*}
 */
const createAssetModelParameter = catchAsync(async (req, res) => {
    req.body = {
        ...req.body,
        createdBy: req.user.id,
        updatedBy: req.user.id,
    };
    const assetModelParameter = await assetModelParameterService.createAssetModelParameter(req.body);
    res.status(httpStatus.CREATED).send({ code: 1, assetModelParameter });
});
const getAssetModelParameters = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['assetModel']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await assetModelParameterService.queryAssetModelParameters(filter, options);
    res.send({ results: result, code: 1 });
});

const getAssetModelParameterById = catchAsync(async (req, res) => {
    const assetModelParameter = await assetModelParameterService.getAssetModelParameterById(req.query.id);
    if (!assetModelParameter) {
        throw new ApiError(httpStatus.NOT_FOUND, 'category not found');
    }
    res.send({ assetModelParameter, code: 1 });
});

/**
 * Update user by id.
 * @type {(function(*, *, *): void)|*}
 */
const updateAssetModelParameter = catchAsync(async (req, res) => {
    // updateData.updatedBy = req.user.id; // Nếu cần
    const updated = await assetModelParameterService.updateAssetModelParameterById(req.params.id, req.body);
    res.send({ code: 1, data: updated });
});

/**
 * Delete user by id.
 * @type {(function(*, *, *): void)|*}
 */
const deleteAssetModelParameter = catchAsync(async (req, res) => {
    await assetModelParameterService.deleteAssetModelParameterById(req.query.id);
    res.status(httpStatus.OK).send({ code: 1 });
});

const getAllAssetModelParameter = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['assetModel']);
    const assetModelParameters = await assetModelParameterService.getAllAssetModelParameter(filter);
    res.send({ code: 1, data: assetModelParameters });
});
const uploadExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.send({ code: 0, message: "Not file" })
        }
        const result = await assetModelParameterService.uploadExcel(req.file.path, req.file, req)
        return res.send({ code: 1, result })
    } catch (error) {
        return res.send({ code: 0, message: error.message || "Tải file lên không thành công" })
    }
};
module.exports = {
    createAssetModelParameter,
    getAssetModelParameters,
    getAssetModelParameterById,
    updateAssetModelParameter,
    deleteAssetModelParameter,
    getAllAssetModelParameter,
    uploadExcel,
};
