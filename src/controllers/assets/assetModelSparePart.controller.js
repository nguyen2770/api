const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const { assetModelSparePartService } = require('../../services');
const ApiError = require('../../utils/ApiError');

/**
 * Create a user
 * @type {(function(*, *, *): void)|*}
 */
const createAssetModelSparePart = catchAsync(async (req, res) => {
    const data = {
        ...req.body,
        // createdBy: req.user.id,
        // updatedBy: req.user.id,
    };
    const assetModelSparePart = await assetModelSparePartService.createAssetModelSparePart(data);
    res.status(httpStatus.CREATED).send({ code: 1, data: assetModelSparePart });
});

const getAssetModelSparePartById = catchAsync(async (req, res) => {
    const assetModelSparePart = await assetModelSparePartService.getAssetModelSparePartById(req.query.id);
    if (!assetModelSparePart) {
        throw new ApiError(httpStatus.NOT_FOUND, 'assetModelSparePartService not found');
    }
    res.send({ code: 1, data: assetModelSparePart });
});

/**
 * Update user by id.
 * @type {(function(*, *, *): void)|*}
 */
const updateAssetModelSparePart = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body.data;
    // updateData.updatedBy = req.user.id; // Nếu cần
    const updated = await assetModelSparePartService.updateAssetModelSparePartById(id, updateData);
    res.send({ code: 1, data: updated });
});

/**
 * Delete user by id.
 * @type {(function(*, *, *): void)|*}
 */
const deleteAssetModelSparePart = catchAsync(async (req, res) => {
    await assetModelSparePartService.deleteAssetModelSparePartById(req.query.id);
    res.status(httpStatus.OK).send({ code: 1 });
});

const getAllAssetModelSparePart = catchAsync(async (req, res) => {
    const assetModelSpareParts = await assetModelSparePartService.getAllAssetModelSparePart();
    res.send({ code: 1, data: assetModelSpareParts });
});

const getResById = catchAsync(async (req, res) => {
    const assetModelSparePart = await assetModelSparePartService.getResById(req.query.id);
    if (!assetModelSparePart) {
        throw new ApiError(httpStatus.NOT_FOUND, 'assetModelSparePartService not found');
    }
    res.send({ code: 1, data: assetModelSparePart });
});

module.exports = {
    createAssetModelSparePart,
    getAssetModelSparePartById,
    updateAssetModelSparePart,
    deleteAssetModelSparePart,
    getAllAssetModelSparePart,
    getResById,
};
