const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const catchAsync = require('../../utils/catchAsync');
const { assetModelFailureTypeService } = require('../../services');
const ApiError = require('../../utils/ApiError');

/**
 * Create a user
 * @type {(function(*, *, *): void)|*}
 */
const createAssetModelFailureType = catchAsync(async (req, res) => {
    req.body = {
        ...req.body,
        createdBy: req.user.id,
        updatedBy: req.user.id,
    };
    const assetModelFailureType = await assetModelFailureTypeService.createAssetModelFailureType(req.body);
    res.status(httpStatus.CREATED).send({ code: 1, assetModelFailureType });
});
const getAssetModelFailureTypes = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['assetModel']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await assetModelFailureTypeService.queryAssetModelFailureTypes(filter, options);
    // exchangeRequests.abc = 123;
    res.send({ results: result, code: 1 });
});
const getAssetModelFailureTypesUnusedSeftDiagnosia = catchAsync(async (req, res) => {
    const result = await assetModelFailureTypeService.getAssetModelFailureTypesUnusedSeftDiagnosia(
        req.body.assetModel,
        req.body.ignoreIds
    );
    // exchangeRequests.abc = 123;
    res.send({ code: 1, data: result });
});
const getAssetModelFailureTypesUnusedSolution = catchAsync(async (req, res) => {
    const result = await assetModelFailureTypeService.getAssetModelFailureTypesUnusedSolution(
        req.body.assetModel,
        req.body.ignoreIds
    );
    // exchangeRequests.abc = 123;
    res.send({ code: 1, data: result });
});
const getAssetModelFailureTypeById = catchAsync(async (req, res) => {
    const assetModelFailureType = await assetModelFailureTypeService.getAssetModelFailureTypeById(req.query.id);
    if (!assetModelFailureType) {
        throw new ApiError(httpStatus.NOT_FOUND, 'category not found');
    }
    res.send({ assetModelFailureType, code: 1 });
});

/**
 * Update user by id.
 * @type {(function(*, *, *): void)|*}
 */
const updateAssetModelFailureType = catchAsync(async (req, res) => {
    // updateData.updatedBy = req.user.id; // Nếu cần
    const updated = await assetModelFailureTypeService.updateAssetModelFailureTypeById(req.params.id, req.body);
    res.send({ code: 1, data: updated });
});

/**
 * Delete user by id.
 * @type {(function(*, *, *): void)|*}
 */
const deleteAssetModelFailureType = catchAsync(async (req, res) => {
    await assetModelFailureTypeService.deleteAssetModelFailureTypeById(req.query.id);
    res.status(httpStatus.OK).send({ code: 1 });
});

const getAllAssetModelFailureType = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['assetModel']);
    const assetModelFailureTypes = await assetModelFailureTypeService.getAllAssetModelFailureType(filter);
    res.send({ code: 1, data: assetModelFailureTypes });
});
const uploadExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.send({ code: 0, message: "Not file" })
        }
        const result = await assetModelFailureTypeService.uploadExcel(req.file.path, req.file, req)
        return res.send({ code: 1, result })
    } catch (error) {
        return res.send({ code: 0, message: error.message || "Tải file lên không thành công" })
    }
};

module.exports = {
    createAssetModelFailureType,
    getAssetModelFailureTypes,
    getAssetModelFailureTypeById,
    updateAssetModelFailureType,
    deleteAssetModelFailureType,
    getAllAssetModelFailureType,
    getAssetModelFailureTypesUnusedSeftDiagnosia,
    getAssetModelFailureTypesUnusedSolution,
    uploadExcel,
};
