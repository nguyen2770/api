const { Types } = require("mongoose");
const httpStatus = require('http-status');
const { SubCategory } = require('../../models');
const ApiError = require('../../utils/ApiError');

/**
 * Create a user
 * @param {Object} category
 * @returns {Promise<User>}
 */
const createSubCategory = async (category) => {
    return SubCategory.create(category);
};

/**
 * Query for users
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const querySubCategorys = async (filter, options) => {
    if (filter.categoryId) {
        // eslint-disable-next-line no-param-reassign
        filter.categoryId = Types.ObjectId(filter.categoryId);
    }
    const categorys = await SubCategory.paginate(filter, {
        options,
        populate: [
            {
                path: 'categoryId',
            }
        ]
    })
    return categorys;
};

/**
 * Get user by id
 * @param {ObjectId} id
 * @returns {Promise<User>}
 */
const getSubCategoryById = async (id) => {
    return SubCategory.findById(id);
};

const updateSubCategoryById = async (id, updateBody) => {
    const subCategory = await getSubCategoryById(id);
    if (!subCategory) {
        throw new ApiError(httpStatus.NOT_FOUND, 'SubCategory not found');
    }
    Object.assign(subCategory, updateBody);
    await subCategory.save();
    return subCategory;
};
const updateStatus = async (id, updateBody) => {
    const subCategory = await getSubCategoryById(id);
    if (!subCategory) {
        throw new ApiError(httpStatus.NOT_FOUND, 'SubCategory not found');
    }
    Object.assign(subCategory, updateBody);
    await subCategory.save();
    return subCategory;
};
const deleteSubCategoryById = async (id) => {
    const subCategory = await getSubCategoryById(id);
    if (!subCategory) {
        throw new ApiError(httpStatus.NOT_FOUND, 'SubCategory not found');
    }
    await subCategory.remove();
    return subCategory;
};

const getAllSubCategory = async () => {
    const subCategorys = await SubCategory.find();
    return subCategorys;
};

const getSubCategoryByCategoryId = async (categoryId) => {
    const subCategorys = await SubCategory.find({ categoryId });
    return subCategorys;
};
module.exports = {
    querySubCategorys,
    getSubCategoryById,
    updateSubCategoryById,
    deleteSubCategoryById,
    createSubCategory,
    updateStatus,
    getAllSubCategory,
    getSubCategoryByCategoryId,
};
