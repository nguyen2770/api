const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const catchAsync = require('../../utils/catchAsync');
const { categoryService } = require('../../services');
const ApiError = require('../../utils/ApiError');

/**
 * Create a user
 * @type {(function(*, *, *): void)|*}
 */
const createCategory = catchAsync(async (req, res) => {
    req.body = {
        ...req.body,
        // createdBy: req.user.id,
        // updatedBy: req.user.id,
    };
    const category = await categoryService.createCategory(req.body);
    res.status(httpStatus.CREATED).send({ code: 1, category });
});
const getCategorys = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['categoryName']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await categoryService.queryCategorys(filter, options);
    // exchangeRequests.abc = 123;
    res.send({ results: result, code: 1 });
});

const getCategoryById = catchAsync(async (req, res) => {
    const category = await categoryService.getCategoryById(req.query.id);
    if (!category) {
        throw new ApiError(httpStatus.NOT_FOUND, 'category not found');
    }
    res.send({ code: 1, category });
});

/**
 * Update user by id.
 * @type {(function(*, *, *): void)|*}
 */
const updateCategory = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body.category;
    // updateData.updatedBy = req.user.id; // Nếu cần
    const updated = await categoryService.updateCategoryById(id, updateData);
    res.send({ code: 1, data: updated });
});

/**
 * Delete user by id.
 * @type {(function(*, *, *): void)|*}
 */
const deleteCategory = catchAsync(async (req, res) => {
    await categoryService.deleteCategoryById(req.query.id);
    res.status(httpStatus.OK).send({ code: 1 });
});

const updateStatus = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body.category;
    const updated = await categoryService.updateStatus(id, updateData);
    res.send({ code: 1, data: updated });
});

const getAllCategory = catchAsync(async (req, res) => {
    const categories = await categoryService.getAllCategory();
    res.send({ code: 1, data: categories });
});
module.exports = {
    createCategory,
    getCategorys,
    getCategoryById,
    updateCategory,
    deleteCategory,
    updateStatus,
    getAllCategory,
};
