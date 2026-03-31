const { Types } = require("mongoose");
const httpStatus = require('http-status');
const { AssetTypeModel } = require('../../models');
const ApiError = require('../../utils/ApiError');


/**
 * Create a user
 * @param {Object} category
 * @returns {Promise<User>}
 */
const createAssetType = async (category) => {
    return AssetTypeModel.create(category);
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
const queryAssetTypes = async (filter, options) => {
    if (filter.asset) {
        // eslint-disable-next-line no-param-reassign
        filter.asset = Types.ObjectId(filter.asset);
    }
    if (filter.assetTypeCategory) {
        // eslint-disable-next-line no-param-reassign
        filter.assetTypeCategory = Types.ObjectId(filter.assetTypeCategory);
    }
    if (filter.expectedPriceTo && filter.expectedPriceFrom) {
        filter.expectedPrice = {
            $gte: filter.expectedPriceFrom,
            $lte: filter.expectedPriceTo
        };
        delete filter.expectedPriceTo;
        delete filter.expectedPriceFrom;
    }
    if (filter.expectedPriceTo && !filter.expectedPriceFrom) {
        filter.expectedPrice = {
            $lte: filter.expectedPriceTo
        };
        delete filter.expectedPriceTo;
    }
    if (filter.expectedPriceFrom && !filter.expectedPriceTo) {
        filter.expectedPrice = {
            $gte: filter.expectedPriceFrom,
        };
        delete filter.expectedPriceFrom;
    }
    const assets = await AssetTypeModel.paginate(filter, {
        options,
        populate: [
            {
                path: 'asset',
            },
            {
                path: 'assetTypeCategory',
            },
        ]
    })
    return assets;
};

/**
 * Get user by id
 * @param {ObjectId} id
 * @returns {Promise<User>}
 */
const getAssetTypeById = async (id) => {
    const assets = await AssetTypeModel.findById(id).populate([{
        path: 'asset'
    }, {
        path: 'assetTypeCategory'
    }]);
    return assets;
};

const updateAssetTypeById = async (id, updateBody) => {
    const assetType = await getAssetTypeById(id);
    if (!assetType) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Asset not found');
    }
    Object.assign(assetType, updateBody);
    await assetType.save();
    return assetType;
};
const updateStatus = async (id, updateBody) => {
    const asset = await getAssetTypeById(id);
    if (!asset) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Asset not found');
    }
    Object.assign(asset, updateBody);
    await asset.save();
    return asset;
};
const deleteAssetTypeById = async (id) => {
    const assetType = await getAssetTypeById(id);
    if (!assetType) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Asset not found');
    }
    await assetType.remove();
    return assetType;
};

const getAllAssetType = async () => {
    const categorys = await AssetTypeModel.find()
    return categorys;
};

const getAllAssetTypeByAsset = async (asset) => {
    const assetType = await AssetTypeModel.find({ asset })
        .populate({ path: "asset" })
        .populate({ path: "assetTypeCategory" });
    return assetType;
};
module.exports = {
    queryAssetTypes,
    getAssetTypeById,
    updateAssetTypeById,
    deleteAssetTypeById,
    createAssetType,
    updateStatus,
    getAllAssetType,
    getAllAssetTypeByAsset
};
