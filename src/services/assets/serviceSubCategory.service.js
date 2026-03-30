const httpStatus = require('http-status');
const { ServiceSubCategoryModel } = require('../../models');
const ApiError = require('../../utils/ApiError');

const createServiceSubCategory = async (_spSubegory) => {
    return ServiceSubCategoryModel.create(_spSubegory);
};

const queryServiceSubCategories = async (filter, options) => {
    const serviceSubCategories = await ServiceSubCategoryModel.paginate(filter, options);
    return serviceSubCategories;
};

const getServiceSubCategoryById = async (id) => {
    return ServiceSubCategoryModel.findById(id);
};

const updateServiceSubCategoryById = async (_id, updateBody) => {
    const serviceSubCategory = await getServiceSubCategoryById(_id);
    if (!serviceSubCategory) {
        throw new ApiError(httpStatus.NOT_FOUND, 'serviceSubCategory not found');
    }

    Object.assign(serviceSubCategory, updateBody);
    await serviceSubCategory.save();
    return serviceSubCategory;
};
const deleteServiceSubCategoryById = async (id) => {
    const serviceSubCategory = await getServiceSubCategoryById(id);
    if (!serviceSubCategory) {
        throw new ApiError(httpStatus.NOT_FOUND, 'serviceSubCategory not found');
    }
    await serviceSubCategory.remove();
    return serviceSubCategory;
};
const getServicerSubCategoryByServiceCategory = async (id) => {
    const res = await ServiceSubCategoryModel.find({ serviceCategory: id });
    return res;
};
const getAllServiceSubCategory = async (filter) => {
    const res = await ServiceSubCategoryModel.find(filter);
    return res;
};
module.exports = {
    queryServiceSubCategories,
    createServiceSubCategory,
    updateServiceSubCategoryById,
    getServiceSubCategoryById,
    deleteServiceSubCategoryById,
    getServicerSubCategoryByServiceCategory,
    getAllServiceSubCategory,
};
