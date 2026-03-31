const httpStatus = require('http-status');
const { SpareCategoryModel } = require('../../models');
const ApiError = require('../../utils/ApiError');


const createSpareCategory = async (_spareCategory) => {

    return SpareCategoryModel.create(_spareCategory);
};


const querySpareCategories = async (filter, options) => {
    const spareCategories = await SpareCategoryModel.paginate(filter, options);
    return spareCategories;
};

const getAllSpareCategories = async () => {
    return await SpareCategoryModel.find().sort({ createdAt: -1 });
}

const getSpareCategoryById = async (id) => {
    return SpareCategoryModel.findById(id);
};


const updateSpareCategoryById = async (_id, updateBody) => {
    const spareCategory = await getSpareCategoryById(_id);
    if (!spareCategory) {
        throw new ApiError(httpStatus.NOT_FOUND, 'spareCategory not found');
    }

    Object.assign(spareCategory, updateBody);
    await spareCategory.save();
    return spareCategory;
};
const deleteSpareCategoryById = async (id) => {
    const spareCategory = await getSpareCategoryById(id);
    if (!spareCategory) {
        throw new ApiError(httpStatus.NOT_FOUND, 'spareCategory not found');
    }
    await spareCategory.remove();
    return spareCategory;
};
// const deleteManufactureById = async (userId) => {
//     const manufacturer = await getManufacturerById(userId);
//     if (!manufacturer) {
//         throw new ApiError(httpStatus.NOT_FOUND, 'manufacturer not found');
//     }
//     await manufacturer.remove();
//     return manufacturer;
// };

module.exports = {
    querySpareCategories,
    getAllSpareCategories,
    createSpareCategory,
    updateSpareCategoryById,
    getSpareCategoryById,
    deleteSpareCategoryById
};
