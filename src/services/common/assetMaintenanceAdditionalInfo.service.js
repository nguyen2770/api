const httpStatus = require('http-status');
const { AssetMaintenanceAdditionalInfo } = require('../../models');
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
const createAssetMaintenanceAdditionalInfo = async (data) => {
    return AssetMaintenanceAdditionalInfo.create(data);
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
const queryAssetMaintenanceAdditionalInfos = async (filter, options) => {
    const assets = await AssetMaintenanceAdditionalInfo.paginate(filter, options);
    return assets;
};

const getAssetMaintenanceAdditionalInfoById = async (id) => {
    return AssetMaintenanceAdditionalInfo.findById(id);
};

const updateAssetMaintenanceAdditionalInfoById = async (id, updateBody) => {
    const asset = await getAssetMaintenanceAdditionalInfoById(id);
    if (!asset) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Asset not found');
    }
    Object.assign(asset, updateBody);
    await asset.save();
    return asset;
};
const updateStatus = async (id, updateBody) => {
    const asset = await getAssetMaintenanceAdditionalInfoById(id);
    if (!asset) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Asset not found');
    }
    Object.assign(asset, updateBody);
    await asset.save();
    return asset;
};
const deleteAssetMaintenanceAdditionalInfoById = async (id) => {
    const asset = await getAssetMaintenanceAdditionalInfoById(id);
    if (!asset) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Asset not found');
    }
    await asset.remove();
    return asset;
};

const getAllAssetMaintenanceAdditionalInfo = async () => {
    const assetMaintenanceAdditionalInfos = await AssetMaintenanceAdditionalInfo.find();
    return assetMaintenanceAdditionalInfos;
};

const getResById = async (id) => {
    const assetMaintenanceMonitoringPoints = await AssetMaintenanceAdditionalInfo.find({
        assetMaintenanceId: id,
    });
    return assetMaintenanceMonitoringPoints;
};

module.exports = {
    queryAssetMaintenanceAdditionalInfos,
    getAssetMaintenanceAdditionalInfoById,
    updateAssetMaintenanceAdditionalInfoById,
    deleteAssetMaintenanceAdditionalInfoById,
    createAssetMaintenanceAdditionalInfo,
    updateStatus,
    getAllAssetMaintenanceAdditionalInfo,
    getResById,
};
