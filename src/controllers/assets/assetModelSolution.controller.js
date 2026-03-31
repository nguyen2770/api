const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const catchAsync = require('../../utils/catchAsync');
const { assetModelSolutionService } = require('../../services');
const ApiError = require('../../utils/ApiError');

/**
 * Create a user
 * @type {(function(*, *, *): void)|*}
 */
const createAssetModelSolution = catchAsync(async (req, res) => {
    req.body = {
        ...req.body,
        createdBy: req.user.id,
        updatedBy: req.user.id,
    };
    const assetModelSolutionCreate = {
        ...req.body,
        createdBy: req.user.id,
        updatedBy: req.user.id,
    }
    const assetModelSolution = await assetModelSolutionService.createAssetModelSolution(assetModelSolutionCreate, req.body.tags);
    res.status(httpStatus.CREATED).send({ code: 1, assetModelSolution });
});
const getAssetModelSolutions = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['assetModel']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await assetModelSolutionService.queryAssetModelSolutions(filter, options);
    res.send({ results: result, code: 1 });
});

const getAssetModelSolutionById = catchAsync(async (req, res) => {
    const assetModelSolution = await assetModelSolutionService.getAssetModelSolutionById(req.params.id);
    if (!assetModelSolution) {
        throw new ApiError(httpStatus.NOT_FOUND, 'category not found');
    }
    res.send({
        code: 1, data: {
            assetModelSolution
        }
    });
});

/**
 * Update user by id.
 * @type {(function(*, *, *): void)|*}
 */
const updateAssetModelSolution = catchAsync(async (req, res) => {
    // updateData.updatedBy = req.user.id; // Nếu cần
    const assetModelSolutionCreate = {
        ...req.body,
        createdBy: req.user.id,
        updatedBy: req.user.id,
    }
    const updated = await assetModelSolutionService.updateAssetModelSolutionById(req.params.id, assetModelSolutionCreate, req.body.tags);
    res.send({ code: 1, data: updated });
});
const updateStatus = catchAsync(async (req, res) => {
    // updateData.updatedBy = req.user.id; // Nếu cần
    const updated = await assetModelSolutionService.updateStatus(req.params.id);
    res.send({ code: 1, data: updated });
});

/**
 * Delete user by id.
 * @type {(function(*, *, *): void)|*}
 */
const deleteAssetModelSolution = catchAsync(async (req, res) => {
    await assetModelSolutionService.deleteAssetModelSolutionById(req.query.id);
    res.status(httpStatus.OK).send({ code: 1 });
});

const getAllAssetModelSolution = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['assetModel', 'assetModelFailureType']);
    const assetModelSolutions = await assetModelSolutionService.getAllAssetModelSolution(filter);
    const data = [];
    if (assetModelSolutions.length > 0) {
        // eslint-disable-next-line no-plusplus
        for (let index = 0; index < assetModelSolutions.length; index++) {
            const element = assetModelSolutions[index].toObject();
            // eslint-disable-next-line no-await-in-loop
            element.tags = await assetModelSolutionService.getTagsBySolutionId(element._id)
            data.push(element);
        }
    }
    res.send({ code: 1, data });
});
const uploadExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.send({ code: 0, message: "Not file" })
        }
        const result = await assetModelSolutionService.uploadExcel(req.file.path, req.file, req)
        return res.send({ code: 1, result })
    } catch (error) {
        return res.send({ code: 0, message: error.message || "Tải file lên không thành công" })
    }
};
module.exports = {
    createAssetModelSolution,
    getAssetModelSolutions,
    getAssetModelSolutionById,
    updateAssetModelSolution,
    deleteAssetModelSolution,
    getAllAssetModelSolution,
    updateStatus,
    uploadExcel,
};
