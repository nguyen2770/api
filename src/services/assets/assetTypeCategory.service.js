const httpStatus = require('http-status');
const { AssetTypeCategoryModel } = require('../../models');
const ApiError = require('../../utils/ApiError');

/**
 * Create a user
 * @param {Object} category
 * @returns {Promise<User>}
 */
const createAssetTypeCategory = async (category) => {
    return AssetTypeCategoryModel.create(category);
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
const queryAssetTypeCategorys = async (filter, options) => {
    const assetTypeCategorys = await AssetTypeCategoryModel.paginate(filter, options);
    return assetTypeCategorys;
};

/**
 * Get user by id
 * @param {ObjectId} id
 * @returns {Promise<User>}
 */
const getAssetTypeCategoryById = async (id) => {
    return AssetTypeCategoryModel.findById(id);
};

const updateAssetTypeCategoryById = async (id, updateBody) => {
    const assetTypeCategory = await getAssetTypeCategoryById(id);
    if (!assetTypeCategory) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Asset not found');
    }
    Object.assign(assetTypeCategory, updateBody);
    await assetTypeCategory.save();
    return assetTypeCategory;
};
const updateStatus = async (id, updateBody) => {
    const assetTypeCategory = await getAssetTypeCategoryById(id);
    if (!assetTypeCategory) {
        throw new ApiError(httpStatus.NOT_FOUND, 'assetTypeCategory not found');
    }
    Object.assign(assetTypeCategory, updateBody);
    await assetTypeCategory.save();
    return assetTypeCategory;
};
const deleteAssetTypeCategoryById = async (id) => {
    const assetTypeCategory = await getAssetTypeCategoryById(id);
    if (!assetTypeCategory) {
        throw new ApiError(httpStatus.NOT_FOUND, 'assetTypeCategory not found');
    }
    await assetTypeCategory.remove();
    return assetTypeCategory;
};

const getAllAssetTypeCategory = async () => {
    const assetTypeCategorys = await AssetTypeCategoryModel.find({ status: true });
    return assetTypeCategorys;
};
module.exports = {
    queryAssetTypeCategorys,
    getAssetTypeCategoryById,
    updateAssetTypeCategoryById,
    deleteAssetTypeCategoryById,
    createAssetTypeCategory,
    updateStatus,
    getAllAssetTypeCategory,
};
