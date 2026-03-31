const httpStatus = require('http-status');
const {
    AssetMaintenanceSolutionBank,
    AssetMaintenanceDefect,
    AssetMaintenanceSelfDiagnosi,
    AssetModelFailureTypeModel,
} = require('../../models');
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
const createAssetMaintenanceSolutionBank = async (data) => {
    return AssetMaintenanceSolutionBank.create(data);
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
const queryAssetMaintenanceSolutionBanks = async (filter, options) => {
    const assets = await AssetMaintenanceSolutionBank.paginate(filter, options);
    return assets;
};

const getAssetMaintenanceSolutionBankById = async (id) => {
    return AssetMaintenanceSolutionBank.findById(id);
};

const updateAssetMaintenanceSolutionBankById = async (id, updateBody) => {
    const asset = await getAssetMaintenanceSolutionBankById(id);
    if (!asset) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Asset not found');
    }
    Object.assign(asset, updateBody);
    await asset.save();
    return asset;
};
const updateStatus = async (id, updateBody) => {
    const asset = await getAssetMaintenanceSolutionBankById(id);
    if (!asset) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Asset not found');
    }
    Object.assign(asset, updateBody);
    await asset.save();
    return asset;
};
const deleteAssetMaintenanceSolutionBankById = async (id) => {
    const asset = await getAssetMaintenanceSolutionBankById(id);
    if (!asset) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Asset not found');
    }
    await asset.remove();
    return asset;
};

const getAllAssetMaintenanceSolutionBank = async () => {
    const assetMaintenanceSolutionBanks = await AssetMaintenanceSolutionBank.find();
    return assetMaintenanceSolutionBanks;
};

const getResById = async (id) => {
    const assetMaintenanceMonitoringPoints = await AssetMaintenanceSolutionBank.find({
        assetMaintenanceId: id,
    }).populate([
        {
            path: 'createdBy',
            select: 'username',
        },
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
const getDefectNotUsed = async (assetMaintenanceId) => {
    // Lấy danh sách defectId đã được sử dụng trong SolutionBank
    const usedDefectIdsFromSolution = await AssetMaintenanceSolutionBank.find({ assetMaintenanceId }).distinct(
        'assetMaintenanceDefectId'
    );

    // Lấy danh sách defectId đã được sử dụng trong SelfDiagnosi
    const usedDefectIdsFromSelfDiagnosi = await AssetMaintenanceSelfDiagnosi.find({ assetMaintenanceId }).distinct(
        'assetMaintenanceDefectId'
    );

    // Kết hợp tất cả defect đã được sử dụng
    const allUsedDefectIds = [...new Set([...usedDefectIdsFromSolution, ...usedDefectIdsFromSelfDiagnosi])];

    // Trả về danh sách các defect chưa được sử dụng
    const defects = await AssetMaintenanceDefect.find({
        assetMaintenanceId,
        _id: { $nin: allUsedDefectIds },
    });

    return defects;
};

module.exports = {
    queryAssetMaintenanceSolutionBanks,
    getAssetMaintenanceSolutionBankById,
    updateAssetMaintenanceSolutionBankById,
    deleteAssetMaintenanceSolutionBankById,
    createAssetMaintenanceSolutionBank,
    updateStatus,
    getAllAssetMaintenanceSolutionBank,
    getResById,
    getDefectNotUsed,
};
