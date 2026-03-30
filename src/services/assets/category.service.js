const httpStatus = require('http-status');
const { Category } = require('../../models');
const ApiError = require('../../utils/ApiError');

// /**
//  *
//  * @returns
//  */
// const savecCategory = async (status) => {
//     const create = await Category.create({
//         status,
//     });
//     return create;
// };

/**
 * Create a user
 * @param {Object} category
 * @returns {Promise<User>}
 */
const createCategory = async (category) => {
    return Category.create(category);
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
const queryCategorys = async (filter, options) => {
    const categorys = await Category.paginate(filter, options);
    return categorys;
};

/**
 * Get user by id
 * @param {ObjectId} id
 * @returns {Promise<User>}
 */
const getCategoryById = async (id) => {
    return Category.findById(id);
};

const updateCategoryById = async (id, updateBody) => {
    const category = await getCategoryById(id);
    if (!category) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');
    }
    Object.assign(category, updateBody);
    await category.save();
    return category;
};
const updateStatus = async (id, updateBody) => {
    const category = await getCategoryById(id);
    if (!category) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');
    }
    Object.assign(category, updateBody);
    await category.save();
    return category;
};
const deleteCategoryById = async (id) => {
    const category = await getCategoryById(id);
    if (!category) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');
    }
    await category.remove();
    return category;
};

const getAllCategory = async () => {
    const categorys = await Category.find();
    return categorys;
};
module.exports = {
    queryCategorys,
    getCategoryById,
    updateCategoryById,
    deleteCategoryById,
    createCategory,
    updateStatus,
    getAllCategory,
};
