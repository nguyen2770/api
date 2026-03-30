const httpStatus = require('http-status');
const { AssetMaintenanceDefect} = require('../../models');
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
const createAssetMaintenanceDefect= async (data) => {
    return AssetMaintenanceDefect.create(data);
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
const queryAssetMaintenanceDefects = async (filter, options) => {
    const assets = await AssetMaintenanceDefect.paginate(filter, options);
    return assets;
};

const getAssetMaintenanceDefectById = async (id) => {
    return AssetMaintenanceDefect.findById(id);
};

const updateAssetMaintenanceDefectById = async (id, updateBody) => {
    const asset = await getAssetMaintenanceDefectById(id);
    if (!asset) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Asset not found');
    }
    Object.assign(asset, updateBody);
    await asset.save();
    return asset;
};
const updateStatus = async (id, updateBody) => {
    const asset = await getAssetMaintenanceDefectById(id);
    if (!asset) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Asset not found');
    }
    Object.assign(asset, updateBody);
    await asset.save();
    return asset;
};
const deleteAssetMaintenanceDefectById = async (id) => {
    const asset = await getAssetMaintenanceDefectById(id);
    if (!asset) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Asset not found');
    }
    await asset.remove();
    return asset;
};

const getAllAssetMaintenanceDefect= async () => {
    const assetMaintenanceDefects = await AssetMaintenanceDefect.find();
    return assetMaintenanceDefects;
};

const getResById = async (id) => {
    const assetMaintenanceMonitoringPoints = await AssetMaintenanceDefect.find({
        assetMaintenanceId: id,
    });
    return assetMaintenanceMonitoringPoints;
};

module.exports = {
    queryAssetMaintenanceDefects,
    getAssetMaintenanceDefectById,
    updateAssetMaintenanceDefectById,
    deleteAssetMaintenanceDefectById,
    createAssetMaintenanceDefect,
    updateStatus,
    getAllAssetMaintenanceDefect,
    getResById,
};
