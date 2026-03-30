const httpStatus = require('http-status');
const { Types } = require('mongoose');
const { SpareSubCategoryModel } = require('../../models');
const ApiError = require('../../utils/ApiError');


const createSpareSubCategory = async (_spSubegory) => {

    return SpareSubCategoryModel.create(_spSubegory);
};


const querySpareSubCategories = async (filter, options) => {
    if (filter.spareCategory) {
        filter.spareCategory = Types.ObjectId(filter.spareCategory)
    }
    const spareSubCategories = await SpareSubCategoryModel.paginate(filter, options);
    return spareSubCategories;
};

const getSpareSubCategoryById = async (id) => {
    return SpareSubCategoryModel.findById(id);
};


const updateSpareSubCategoryById = async (_id, updateBody) => {
    const spareSubCategory = await getSpareSubCategoryById(_id);
    if (!spareSubCategory) {
        throw new ApiError(httpStatus.NOT_FOUND, 'spareSubCategory not found');
    }

    Object.assign(spareSubCategory, updateBody);
    await spareSubCategory.save();
    return spareSubCategory;
};
const deleteSpareSubCategoryById = async (id) => {
    const spareSubCategory = await getSpareSubCategoryById(id);
    if (!spareSubCategory) {
        throw new ApiError(httpStatus.NOT_FOUND, 'spareSubCategory not found');
    }
    await spareSubCategory.remove();
    return spareSubCategory;
};
const getSubCategoryByCategoryId = async (categoryId) => {
    const subCategorys = await SpareSubCategoryModel.find({ spareCategory: categoryId });
    return subCategorys;
};

module.exports = {
    querySpareSubCategories,
    createSpareSubCategory,
    updateSpareSubCategoryById,
    getSpareSubCategoryById,
    deleteSpareSubCategoryById,
    getSubCategoryByCategoryId,
};
