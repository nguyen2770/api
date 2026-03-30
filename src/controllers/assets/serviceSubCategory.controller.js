const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const ApiError = require('../../utils/ApiError');
const catchAsync = require('../../utils/catchAsync');
const { serviceSubCategoryService, serviceCategoryService } = require('../../services');

const createServiceSubCategory = catchAsync(async (req, res) => {
    req.body = {
        ...req.body,
        createdBy: req.user.id,
        updatedBy: req.user.id,
    };
    const serviceSubCategory = await serviceSubCategoryService.createServiceSubCategory(req.body);
    res.send({ code: 1, data: serviceSubCategory });
});
const updateStatus = catchAsync(async (req, res) => {
    const serviceSubCategory = await serviceSubCategoryService.getServiceSubCategoryById(req.params.id);
    if (!serviceSubCategory) {
        throw new ApiError(httpStatus.NOT_FOUND, 'serviceSubCategory not found');
    }
    const serviceSubCategoryObj = serviceSubCategory.toObject();
    const payload = {
        status: !serviceSubCategoryObj.status,
    };
    const serviceSubCategoryUpdate = await serviceSubCategoryService.updateServiceSubCategoryById(req.params.id, payload);
    res.send({ code: 1, data: serviceSubCategoryUpdate });
});
const updateServiceSubCategory = catchAsync(async (req, res) => {
    req.body = {
        ...req.body,
        updatedBy: req.user.id,
    };
    const serviceSubCategory = await serviceSubCategoryService.updateServiceSubCategoryById(req.params.id, req.body);
    res.send({ code: 1, data: serviceSubCategory });
});
const getServiceSubCategories = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['name']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const serviceSubCategoryPage = await serviceSubCategoryService.queryServiceSubCategories(filter, options);
    const serviceSubCategories = [];
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < serviceSubCategoryPage.results.length; i++) {
        const element = serviceSubCategoryPage.results[i].toObject();
        // eslint-disable-next-line no-await-in-loop
        element.serviceCategoryObj = await serviceCategoryService.getServiceCategoryById(element.serviceCategory);
        // eslint-disable-next-line no-await-in-loop
        serviceSubCategories.push(element);
    }
    // exchangeRequests.abc = 123;
    res.send({
        code: 1,
        data: {
            ...serviceSubCategoryPage,
            results: serviceSubCategories,
        },
    });
});
const deleteServiceSubCategory = catchAsync(async (req, res) => {
    await serviceSubCategoryService.deleteServiceSubCategoryById(req.params.id);
    res.status(httpStatus.NO_CONTENT).send({ status: 1 });
});
const getServicerSubCategoryByServiceCategory = catchAsync(async (req, res) => {
    const servicerSubCategorys = await serviceSubCategoryService.getServicerSubCategoryByServiceCategory(req.query.id);
    res.send({ code: 1, data: servicerSubCategorys });
});
const getAllServiceSubCategory = catchAsync(async (req, res) => {
    const servicerSubCategorys = await serviceSubCategoryService.getAllServiceSubCategory();
    res.send({ code: 1, data: servicerSubCategorys });
});
module.exports = {
    getServiceSubCategories,
    createServiceSubCategory,
    updateStatus,
    updateServiceSubCategory,
    deleteServiceSubCategory,
    getServicerSubCategoryByServiceCategory,
    getAllServiceSubCategory,
};
