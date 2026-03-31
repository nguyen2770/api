const httpStatus = require('http-status');
const { ServiceCategoryModel } = require('../../models');
const ApiError = require('../../utils/ApiError');


const createServiceCategory = async (_serviceCategory) => {

    return ServiceCategoryModel.create(_serviceCategory);
};


const queryServiceCategories = async (filter, options) => {
    const serviceCategories = await ServiceCategoryModel.paginate(filter, options);
    return serviceCategories;
};

const getServiceCategoryById = async (id) => {
    return ServiceCategoryModel.findById(id);
};


const updateServiceCategoryById = async (_id, updateBody) => {
    const serviceCategory = await getServiceCategoryById(_id);
    if (!serviceCategory) {
        throw new ApiError(httpStatus.NOT_FOUND, 'serviceCategory not found');
    }

    Object.assign(serviceCategory, updateBody);
    await serviceCategory.save();
    return serviceCategory;
};
const deleteServiceCategoryById = async (id) => {
    const serviceCategory = await getServiceCategoryById(id);
    if (!serviceCategory) {
        throw new ApiError(httpStatus.NOT_FOUND, 'serviceCategory not found');
    }
    await serviceCategory.remove();
    return serviceCategory;
};
// const deleteManufactureById = async (userId) => {
//     const manufacturer = await getManufacturerById(userId);
//     if (!manufacturer) {
//         throw new ApiError(httpStatus.NOT_FOUND, 'manufacturer not found');
//     }
//     await manufacturer.remove();
//     return manufacturer;
// };
const getAllServiceCategory = async () => {
    const serviceCategorys = await ServiceCategoryModel.find();
    return serviceCategorys;
}

module.exports = {
    queryServiceCategories,
    createServiceCategory,
    updateServiceCategoryById,
    getServiceCategoryById,
    deleteServiceCategoryById,
    getAllServiceCategory,
};
