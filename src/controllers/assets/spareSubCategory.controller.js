const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const ApiError = require('../../utils/ApiError');
const catchAsync = require('../../utils/catchAsync');
const { spareSubCategoryService, spareCategoryService } = require('../../services');

const createSpareSubCategory = catchAsync(async (req, res) => {
    req.body = {
        ...req.body,
        createdBy: req.user.id,
        updatedBy: req.user.id,
    };
    const spareSubCategory = await spareSubCategoryService.createSpareSubCategory(req.body);
    res.status(httpStatus.CREATED).send({ spareSubCategory, code: 1 });
});
const updateStatus = catchAsync(async (req, res) => {
    const spareSubCategory = await spareSubCategoryService.getSpareSubCategoryById(req.params.id);
    if (!spareSubCategory) {
        throw new ApiError(httpStatus.NOT_FOUND, 'spareSubCategory not found');
    }
    const spareSubCategoryObj = spareSubCategory.toObject();
    const payload = {
        status: !spareSubCategoryObj.status,
    };
    const spareSubCategoryUpdate = await spareSubCategoryService.updateSpareSubCategoryById(req.params.id, payload);
    res.send({ code: 1, spareSubCategoryUpdate });
});
const updateSpareSubCategory = catchAsync(async (req, res) => {
    req.body = {
        ...req.body,
        updatedBy: req.user.id,
    };
    const spareSubCategory = await spareSubCategoryService.updateSpareSubCategoryById(req.params.id, req.body);
    res.send({ code: 1, spareSubCategory });
});
const getSpareSubCategories = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['spareSubCategoryName', 'spareCategory']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const spareSubCategoryPage = await spareSubCategoryService.querySpareSubCategories(filter, options);
    const spareSubCategories = [];
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < spareSubCategoryPage.results.length; i++) {
        const element = spareSubCategoryPage.results[i].toObject();
        // eslint-disable-next-line no-await-in-loop
        element.spareCategoryObj = await spareCategoryService.getSpareCategoryById(element.spareCategory);
        // eslint-disable-next-line no-await-in-loop
        spareSubCategories.push(element);
    }
    // exchangeRequests.abc = 123;
    res.send({
        data: {
            ...spareSubCategoryPage,
            results: spareSubCategories,
        },code: 1
    });
});
const deleteSpareSubCategory = catchAsync(async (req, res) => {
    await spareSubCategoryService.deleteSpareSubCategoryById(req.params.id);
    res.status(httpStatus.NO_CONTENT).send({ status: 1 });
});
const getSubCategoryByCategoryId = catchAsync(async (req, res) => {
    const { categoryId } = req.query;
    const subCategories = await spareSubCategoryService.getSubCategoryByCategoryId(categoryId);
    res.send({ code: 1, data: subCategories });
});

module.exports = {
    getSpareSubCategories,
    createSpareSubCategory,
    updateStatus,
    updateSpareSubCategory,
    deleteSpareSubCategory,
    getSubCategoryByCategoryId,
};
