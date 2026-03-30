const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const ApiError = require('../../utils/ApiError');
const catchAsync = require('../../utils/catchAsync');
const { spareCategoryService } = require('../../services');


const createSpareCategory = catchAsync(async (req, res) => {
    req.body = {
        ...req.body,
        // createdBy: req.user.id,
        // updatedBy: req.user.id,
    };
    const spareCategory = await spareCategoryService.createSpareCategory(req.body);
    res.status(httpStatus.CREATED).send({spareCategory, code: 1});
});
const updateStatus = catchAsync(async (req, res) => {
    const spareCategory = await spareCategoryService.getSpareCategoryById(req.params.id);
    if (!spareCategory) {
        throw new ApiError(httpStatus.NOT_FOUND, 'spareCategory not found');
    }
    const spareCategoryObj = spareCategory.toObject();
    const payload = {
        status: !spareCategoryObj.status
    };
    const spareCategoryUpdate = await spareCategoryService.updateSpareCategoryById(req.params.id, payload);
    res.send({spareCategoryUpdate, code: 1});
});
const updateSpareCategory = catchAsync(async (req, res) => {
    req.body = {
        ...req.body,
        updatedBy: req.user.id,
    };
    const exam = await spareCategoryService.updateSpareCategoryById(req.params.id, req.body);
    res.send(exam);
});
const getSpareCategories = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['spareCategoryName']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await spareCategoryService.querySpareCategories(filter, options);
    // exchangeRequests.abc = 123;
    res.send({ data: result });
});
const getAllSpareCategories = catchAsync(async (req, res) => {
    const result = await spareCategoryService.getAllSpareCategories();
    res.send({ data: result });
});
const deleteSpareCategory = catchAsync(async (req, res) => {
    await spareCategoryService.deleteSpareCategoryById(req.params.id);
    res.status(httpStatus.NO_CONTENT).send({ status: 1 });
});
module.exports = {
    getSpareCategories,
    getAllSpareCategories,
    createSpareCategory,
    updateStatus,
    updateSpareCategory,
    deleteSpareCategory
};
