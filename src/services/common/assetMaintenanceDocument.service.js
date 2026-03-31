const httpStatus = require('http-status');
const { AssetMaintenanceDocument } = require('../../models');

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
const createAssetMaintenance = async (data) => {
    return AssetMaintenanceDocument.insertMany(data);
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
const queryAssetMaintenanceDocuments = async (filter, options) => {
    const assetMaintenances = await AssetMaintenanceDocument.paginate(filter, {
        ...options,
        populate: [{ path: 'resource', select: 'fileName' }],
    });
    return assetMaintenances;
};
/**
 * Get user by id
 * @param {ObjectId} id
 * @returns {Promise<User>}
 */
const getAssetMaintenanceDocumentById = async (id) => {
    return AssetMaintenanceDocument.findById(id).populate({
        path: 'resource',
        select: 'fileName',
    });
};

const updateAssetMaintenanceDocumentById = async (id, updateBody) => {
    const assetMaintenance = await getAssetMaintenanceDocumentById(id);
    if (!assetMaintenance) {
        throw new ApiError(httpStatus.NOT_FOUND, 'AssetMaintenanceDocument not found');
    }
    Object.assign(assetMaintenance, updateBody);
    await assetMaintenance.save();
    return assetMaintenance;
};
const updateStatus = async (id, updateBody) => {
    const assetMaintenance = await getAssetMaintenanceDocumentById(id);
    if (!assetMaintenance) {
        throw new ApiError(httpStatus.NOT_FOUND, 'AssetMaintenanceDocument not found');
    }
    Object.assign(assetMaintenance, updateBody);
    await assetMaintenance.save();
    return assetMaintenance;
};
const deleteAssetMaintenanceDocumentById = async (id) => {
    const assetMaintenance = await getAssetMaintenanceDocumentById(id);
    if (!assetMaintenance) {
        throw new ApiError(httpStatus.NOT_FOUND, 'AssetMaintenance not found');
    }
    await assetMaintenance.remove();
    return assetMaintenance;
};

const getAllAssetMaintenanceDocument = async () => {
    const assetMaintenances = await AssetMaintenanceDocument.find();
    return assetMaintenances;
};

const getResById = async (id) => {
    const assetMaintenanceMonitoringPoints = await AssetMaintenanceDocument.find({
        assetMaintenance: id,
    }).populate([
        {
            path: 'resource',
            select: 'fileName extension filePath',
            populate: [
                {
                    path: 'createdBy',
                    select: 'fullName'
                }
            ]
        },
        // {
        //     path: 'ticketId',
        //     select: 'name',
        // },
    ]);
    return assetMaintenanceMonitoringPoints;
};

module.exports = {
    queryAssetMaintenanceDocuments,
    getAssetMaintenanceDocumentById,
    updateAssetMaintenanceDocumentById,
    deleteAssetMaintenanceDocumentById,
    createAssetMaintenance,
    updateStatus,
    getAllAssetMaintenanceDocument,
    getResById,
};
