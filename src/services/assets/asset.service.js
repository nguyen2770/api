const mongoose = require('mongoose');
const httpStatus = require('http-status');
const { Asset, AssetModel, AssetMaintenance } = require('../../models');
const ApiError = require('../../utils/ApiError');

/**
 * Create a user
 * @param {Object} category
 * @returns {Promise<User>}
 */
const createAsset = async (data) => {
    const assets = await Asset.countDocuments({ assetName: data.assetName, symbol: data.symbol });
    if (assets > 0) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Chủng loại thiết bị này đã tồn tại');
    }
    const asset = await Asset.create(data);
    return asset;
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
const queryAssets = async (filter, options) => {
    ['assetType', 'category', 'manufacturer', 'subCategory', '_id'].forEach((key) => {
        if (filter[key] && typeof filter[key] === 'string' && mongoose.Types.ObjectId.isValid(filter[key])) {
            // eslint-disable-next-line no-param-reassign
            filter[key] = mongoose.Types.ObjectId(filter[key]);
        }
    });
    const assets = await Asset.paginate(filter, {
        ...options,
        populate: [
            {
                path: 'assetType',
                select: 'name',
            },
            {
                path: 'category',
                select: 'categoryName',
            },
            {
                path: 'manufacturer',
                select: 'manufacturerName',
            },
            {
                path: 'subCategory',
                select: 'subCategoryName',
            },
            {
                path: 'paramaters',
            },
        ],
    });
    return assets;
};

/**
 * Get user by id
 * @param {ObjectId} id
 * @returns {Promise<User>}
 */
const getAssetById = async (id) => {
    return Asset.findById(id);
};
const getMoreInfo = async (id) => {
    return Asset.findById(id).populate([
        {
            path: 'assetType',
        },
        {
            path: 'category',
        },
        {
            path: 'manufacturer',
        },
        {
            path: 'subCategory',
        },
        {
            path: 'paramaters',
        },
    ]);
};

const updateAssetById = async (id, updateBody) => {
    const asset = await getAssetById(id);
    const assets = await Asset.countDocuments({ assetName: updateBody.assetName, symbol: updateBody.symbol, _id: { $ne: asset?._id } });
    if (assets > 0) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Chủng loại thiết bị này đã tồn tại');
    }
    if (!asset) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Asset not found');
    }

    Object.assign(asset, updateBody);
    await asset.save();
    return asset;
};
const updateStatus = async (id, updateBody) => {
    const asset = await getAssetById(id);
    if (!asset) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Asset not found');
    }
    Object.assign(asset, updateBody);
    await asset.save();
    return asset;
};
const deleteAssetById = async (id) => {
    const asset = await getAssetById(id);
    if (!asset) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Asset not found');
    }
    const assetInAssetModel = await AssetModel.exists({ asset: id });
    const assetInAssetMaintenance = await AssetMaintenance.exists({ asset: id });
    if (assetInAssetModel || assetInAssetMaintenance) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Không thể xóa: Category đang được sử dụng ở bảng khác.');
    }
    await asset.remove();
    return asset;
};

const getAllAsset = async () => {
    const categorys = await Asset.find();
    return categorys;
};

const getAssetByRes = async (filter) => {
    if (filter.assetId) {
        // eslint-disable-next-line no-param-reassign
        filter._id = filter.assetId;
        // eslint-disable-next-line no-param-reassign
        delete filter.assetId;
    }
    const assets = await Asset.find(filter).populate([
        {
            path: 'category',
            select: 'categoryName',
        },
        {
            path: 'manufacturer',
            select: 'manufacturerName',
        },
        {
            path: 'subCategory',
            select: 'subCategory',
        },
        {
            path: 'assetType',
            select: 'name',
        },
    ]);
    return assets;
};

const getAssetByAssetName = async (data) => {
    const regex = new RegExp(data.toLowerCase(), 'i');
    const assets = await Asset.find({
        assetName: regex,
    });
    return assets;
};

module.exports = {
    queryAssets,
    getAssetById,
    updateAssetById,
    deleteAssetById,
    createAsset,
    updateStatus,
    getAllAsset,
    getAssetByRes,
    getMoreInfo,
    getAssetByAssetName,
};
