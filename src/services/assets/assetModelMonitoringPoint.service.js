const httpStatus = require('http-status');
const { AssetModelMonitoringPoint } = require('../../models');
const ApiError = require('../../utils/ApiError');

// /**
//  *
//  * @returns
//  */
// const savecAsset = async (status) => {
//     const create = await Asset.create({
//         status,
//     });
//     return create;
// };

/**
 * Create a user
 * @param {Object} category
 * @returns {Promise<User>}
 */
const createAssetModelMonioringPoint = async (assetMMP) => {
    return AssetModelMonitoringPoint.create(assetMMP);
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
const queryAssetModelMonitoringPoins = async (filter, options) => {
    const assets = await AssetModelMonitoringPoint.paginate(filter, options);
    return assets;
};

const getAssetModelMonitoringPoinById = async (id) => {
    return AssetModelMonitoringPoint.findById(id);
};

const updateAssetModelMonitoringPoinById = async (id, updateBody) => {
    const asset = await getAssetModelMonitoringPoinById(id);
    if (!asset) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Asset not found');
    }
    Object.assign(asset, updateBody);
    await asset.save();
    return asset;
};
const updateStatus = async (id, updateBody) => {
    const asset = await getAssetModelMonitoringPoinById(id);
    if (!asset) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Asset not found');
    }
    Object.assign(asset, updateBody);
    await asset.save();
    return asset;
};
const deleteAssetModelMonitoringPoinById = async (id) => {
    const asset = await getAssetModelMonitoringPoinById(id);
    if (!asset) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Asset not found');
    }
    await asset.remove();
    return asset;
};

const getAllAssetModelMonitoringPoint = async () => {
    const assetModelMonitoringPoints = await AssetModelMonitoringPoint.find();
    return assetModelMonitoringPoints;
};

const getResById = async (id) => {
    const assetModelMonitoringPoints = await AssetModelMonitoringPoint.find({
        assetModel: id,
    }).populate({
        path: 'uomId',
    });
    return assetModelMonitoringPoints;
};

module.exports = {
    queryAssetModelMonitoringPoins,
    getAssetModelMonitoringPoinById,
    updateAssetModelMonitoringPoinById,
    deleteAssetModelMonitoringPoinById,
    createAssetModelMonioringPoint,
    updateStatus,
    getAllAssetModelMonitoringPoint,
    getResById,
};
