const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const ApiError = require('../../utils/ApiError');
const catchAsync = require('../../utils/catchAsync');
const { serviceCategoryService } = require('../../services');


const createServiceCategory = catchAsync(async (req, res) => {
    req.body = {
        ...req.body,
        // createdBy: req.user.id,
        // updatedBy: req.user.id,
    };
    const serviceCategory = await serviceCategoryService.createServiceCategory(req.body);
    res.send({ code: 1, data: serviceCategory });
});
const updateStatus = catchAsync(async (req, res) => {
    const serviceCategory = await serviceCategoryService.getServiceCategoryById(req.params.id);
    if (!serviceCategory) {
        throw new ApiError(httpStatus.NOT_FOUND, 'serviceCategory not found');
    }
    const serviceCategoryObj = serviceCategory.toObject();
    const payload = {
        status: !serviceCategoryObj.status
    };
    const serviceCategoryUpdate = await serviceCategoryService.updateServiceCategoryById(req.params.id, payload);
    res.send({ code: 1, data: serviceCategoryUpdate });
});
const updateServiceCategory = catchAsync(async (req, res) => {
    req.body = {
        ...req.body,
        updatedBy: req.user.id,
    };
    const serviceCategory = await serviceCategoryService.updateServiceCategoryById(req.params.id, req.body);
    res.send({ code: 1, data: serviceCategory });
});
const getServiceCategories = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['name']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await serviceCategoryService.queryServiceCategories(filter, options);
    // exchangeRequests.abc = 123;
    res.send({ code: 1, data: result });
});
const deleteServiceCategory = catchAsync(async (req, res) => {
    await serviceCategoryService.deleteServiceCategoryById(req.params.id);
    res.send({ code: 1 });
});

const getAllServiceCategory = catchAsync(async (req, res) => {
  const serviceCategorys =   await serviceCategoryService.getAllServiceCategory();
    res.send({ code: 1, data: serviceCategorys });
});
module.exports = {
    getServiceCategories,
    createServiceCategory,
    updateStatus,
    updateServiceCategory,
    deleteServiceCategory,
    getAllServiceCategory
};
