const { Types } = require("mongoose");
const httpStatus = require('http-status');
const { AssetTypeParameterModel } = require('../../models');
const ApiError = require('../../utils/ApiError');

const createAssetTypeParameter = async (_assetTypeParameter) => {
    return AssetTypeParameterModel.create(_assetTypeParameter);
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
const queryAssetTypeParameters = async (filter, options) => {
    if (filter.assetType) {
        // eslint-disable-next-line no-param-reassign
        filter.assetType = Types.ObjectId(filter.assetType);
    }
    const assets = await AssetTypeParameterModel.paginate(filter, {
        options,
        populate: [
            {
                path: 'uom',
            }
        ]
    })
    return assets;
};

/**
 * Get user by id
 * @param {ObjectId} id
 * @returns {Promise<User>}
 */
const getAssetTypeParameterById = async (id) => {
    return AssetTypeParameterModel.findById(id).populate({
        path: 'uom'
    });
};

const updateAssetTypeParameterById = async (id, updateBody) => {
    const assetTypeParameter = await getAssetTypeParameterById(id);
    if (!assetTypeParameter) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Asset not found');
    }
    Object.assign(assetTypeParameter, updateBody);
    await assetTypeParameter.save();
    return assetTypeParameter;
};
const deleteAssetTypeParameterById = async (id) => {
    const assetTypeParameter = await getAssetTypeParameterById(id);
    if (!assetTypeParameter) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Asset not found');
    }
    await assetTypeParameter.remove();
    return assetTypeParameter;
};

const getAllAssetTypeParameter = async (filter) => {
    const assetTypeParameters = await AssetTypeParameterModel.find(filter).populate({
        path: 'uom'
    });;
    return assetTypeParameters;
};
module.exports = {
    queryAssetTypeParameters,
    getAssetTypeParameterById,
    updateAssetTypeParameterById,
    deleteAssetTypeParameterById,
    createAssetTypeParameter,
    getAllAssetTypeParameter,
};
