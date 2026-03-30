const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const catchAsync = require('../../utils/catchAsync');
const { subCategoryService } = require('../../services');
const ApiError = require('../../utils/ApiError');

/**
 * Create a user
 * @type {(function(*, *, *): void)|*}
 */
const createSubCategory = catchAsync(async (req, res) => {
    req.body = {
        ...req.body,
        // createdBy: req.user.id,
        // updatedBy: req.user.id,
    };
    const subCategory = await subCategoryService.createSubCategory(req.body);
    res.status(httpStatus.CREATED).send({ code: 1, subCategory });
});
const getSubCategorys = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['subCategoryName', 'categoryId']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await subCategoryService.querySubCategorys(filter, options);
    // exchangeRequests.abc = 123;
    res.send({ results: result, code :1 });
});

const getSubCategoryById = catchAsync(async (req, res) => {
    const subCategory = await subCategoryService.getSubCategoryById(req.query.id);
    if (!subCategory) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Sub Category not found');
    }
    res.send({subCategory, code: 1});
});

/**
 * Update user by id.
 * @type {(function(*, *, *): void)|*}
 */
const updateSubCategory = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body.subCategory;
    // updateData.updatedBy = req.user.id; // Nếu cần
    const updated = await subCategoryService.updateSubCategoryById(id, updateData);
    res.send({ code: 1, data: updated });
});

/**
 * Delete user by id.
 * @type {(function(*, *, *): void)|*}
 */
const deleteSubCategory = catchAsync(async (req, res) => {
    await subCategoryService.deleteSubCategoryById(req.query.id);
    res.status(httpStatus.OK).send({ code: 1 });
});

const updateStatus = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body.subCategory;
    const updated = await subCategoryService.updateStatus(id, updateData);
    res.send({ code: 1, data: updated });
});

const getAllSubCategory = catchAsync(async (req, res) => {
    const subCategories = await subCategoryService.getAllSubCategory();
    res.send({ code: 1, data: subCategories });
});
const getSubCategoryByCategoryId = catchAsync(async (req, res) => {
    const { categoryId } = req.query;
    const subCategories = await subCategoryService.getSubCategoryByCategoryId(categoryId);
    res.send({ code: 1, data: subCategories });
}
);
module.exports = {
    createSubCategory,
    getSubCategorys,
    getSubCategoryById,
    updateSubCategory,
    deleteSubCategory,
    updateStatus,
    getAllSubCategory,
    getSubCategoryByCategoryId,
};
