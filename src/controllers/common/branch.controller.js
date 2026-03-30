const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const catchAsync = require('../../utils/catchAsync');
const { branchService } = require('../../services');
const ApiError = require('../../utils/ApiError');

/**
 * Create a user
 * @type {(function(*, *, *): void)|*}
 */

const createBranch = catchAsync(async (req, res) => {
    const Branch = await branchService.createBranch({
        ...req.body,
        // createdBy: req.user?.id,
        // updatedBy: req.user?.id,
    });

    res.status(httpStatus.CREATED).send({ code: 1, Branch });
});

const getBranches = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['name']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await branchService.queryBranches(filter, options);
    res.send({ results: result, code: 1 });
});

const getBranchById = catchAsync(async (req, res) => {
    const asset = await branchService.getBranchById(req.query.id);
    if (!asset) {
        throw new ApiError(httpStatus.NOT_FOUND, 'category not found');
    }
    res.send({ code: 1, asset });
});

/**
 * Update user by id.
 * @type {(function(*, *, *): void)|*}
 */
const updateBranch = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body.Branch;
    // updateData.updatedBy = req.user.id; // Nếu cần
    const updated = await branchService.updateBranchById(id, updateData);
    res.send({ code: 1, data: updated });
});

/**
 * Delete user by id.
 * @type {(function(*, *, *): void)|*}
 */
const deleteBranch = catchAsync(async (req, res) => {
    await branchService.deleteBranchById(req.query.id);
    res.status(httpStatus.OK).send({ code: 1 });
});

const getAllBranches = catchAsync(async (req, res) => {
    const Branches = await branchService.getAllBranch();
    res.send({ code: 1, data: Branches });
});

const uploadBranchExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.send({ code: 0, message: 'Not file' });
        }
        const result = await branchService.uploadBranchExcel(req.file.path, req.file);
        return res.send({ code: 1, result });
    } catch (error) {
        return res.send({ code: 0, message: error.message || 'Tải file lên không thành công' });
    }
};

module.exports = {
    createBranch,
    getBranches,
    getBranchById,
    updateBranch,
    deleteBranch,
    getAllBranches,
    uploadBranchExcel,
};
