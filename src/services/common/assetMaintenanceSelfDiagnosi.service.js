const httpStatus = require('http-status');
const { AssetMaintenanceSelfDiagnosi, SelfDiagnosi } = require('../../models');
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
const createAssetMaintenanceSelfDiagnosi = async (data) => {
    return AssetMaintenanceSelfDiagnosi.create(data);
};

const createSelfDiagnosi = async (data) => {
    return SelfDiagnosi.create(data);
};
const getSelfDiagnosiById = async (id) => {
    return SelfDiagnosi.findById(id);
};
const getSelfDiagnosiByIdRes = async (id) => {
    return SelfDiagnosi.find({ assetMaintenanceSelfDiagnosiId: id });
};

const updateSelfDiagnosiById = async (id, updateBody) => {
    const asset = await getSelfDiagnosiById(id);
    if (!asset) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Asset not found');
    }
    Object.assign(asset, updateBody);
    await asset.save();
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

const queryAssetMaintenanceSelfDiagnosis = async (filter, options) => {
    const assets = await AssetMaintenanceSelfDiagnosi.paginate(filter, options);
    return assets;
};

const getAssetMaintenanceSelfDiagnosiById = async (id) => {
    return AssetMaintenanceSelfDiagnosi.findById(id).populate({
        path: 'assetMaintenanceDefectId',
        select: 'name defectTags',
    });
};

const updateAssetMaintenanceSelfDiagnosiById = async (id, updateBody) => {
    const asset = await getAssetMaintenanceSelfDiagnosiById(id);
    if (!asset) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Asset not found');
    }
    Object.assign(asset, updateBody);
    await asset.save();
    return asset;
};
const updateStatus = async (id, updateBody) => {
    const asset = await getAssetMaintenanceSelfDiagnosiById(id);
    if (!asset) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Asset not found');
    }
    Object.assign(asset, updateBody);
    await asset.save();
    return asset;
};
const deleteAssetMaintenanceSelfDiagnosiById = async (id) => {
    const asset = await getAssetMaintenanceSelfDiagnosiById(id);
    if (!asset) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Asset not found');
    }
    await asset.remove();
    return asset;
};

const getAllAssetMaintenanceSelfDiagnosi = async () => {
    const assetMaintenanceSelfDiagnosis = await AssetMaintenanceSelfDiagnosi.find();
    return assetMaintenanceSelfDiagnosis;
};

const getResById = async (id) => {
    const assetMaintenanceMonitoringPoints = await AssetMaintenanceSelfDiagnosi.find({
        assetMaintenanceId: id,
    }).populate([
        {
            path: 'assetMaintenanceDefectId',
            select: 'name defectTags',
        },
        // {
        //     path: 'ticketId',
        //     select: 'name',
        // },
    ]);
    return assetMaintenanceMonitoringPoints;
};

module.exports = {
    queryAssetMaintenanceSelfDiagnosis,
    getAssetMaintenanceSelfDiagnosiById,
    updateAssetMaintenanceSelfDiagnosiById,
    deleteAssetMaintenanceSelfDiagnosiById,
    createAssetMaintenanceSelfDiagnosi,
    updateStatus,
    getAllAssetMaintenanceSelfDiagnosi,
    getResById,
    createSelfDiagnosi,
    updateSelfDiagnosiById,
    getSelfDiagnosiById,
    getSelfDiagnosiByIdRes,
};
