const httpStatus = require('http-status');
const { AssetMaintenanceSchedule } = require('../../models');
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
const createAssetMaintenanceSchedule = async (data) => {
    return AssetMaintenanceSchedule.create(data);
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
const queryAssetMaintenanceSchedules = async (filter, options) => {
    const assets = await AssetMaintenanceSchedule.paginate(filter, options);
    return assets;
};

const getAssetMaintenanceScheduleById = async (id) => {
    return AssetMaintenanceSchedule.findById(id);
};

const updateAssetMaintenanceScheduleById = async (id, updateBody) => {
    const asset = await getAssetMaintenanceScheduleById(id);
    if (!asset) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Asset not found');
    }
    Object.assign(asset, updateBody);
    await asset.save();
    return asset;
};
// const updateStatus = async (id, updateBody) => {
//     const asset = await getAssetMaintenanceScheduleById(id);
//     if (!asset) {
//         throw new ApiError(httpStatus.NOT_FOUND, 'Asset not found');
//     }
//     Object.assign(asset, updateBody);
//     await asset.save();
//     return asset;
// };

const deleteAssetMaintenanceScheduleById = async (id) => {
    const asset = await getAssetMaintenanceScheduleById(id);
    if (!asset) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Asset not found');
    }
    await asset.remove();
    return asset;
};

const getAllAssetMaintenanceSchedule = async () => {
    const assetMaintenanceSchedules = await AssetMaintenanceSchedule.find();
    return assetMaintenanceSchedules;
};

const getResById = async (id, search) => {
    const query = {
        assetMaintenanceId: id,
    };

    if (search && search.trim()) {
        // Tìm kiếm không phân biệt hoa thường theo maintenance_name
        query.maintenance_name = { $regex: search, $options: 'i' };
    }

    const assetMaintenanceMonitoringPoints = await AssetMaintenanceSchedule.find(query);
    return assetMaintenanceMonitoringPoints;
};

module.exports = {
    queryAssetMaintenanceSchedules,
    getAssetMaintenanceScheduleById,
    updateAssetMaintenanceScheduleById,
    deleteAssetMaintenanceScheduleById,
    createAssetMaintenanceSchedule,
    getAllAssetMaintenanceSchedule,
    getResById,
};
