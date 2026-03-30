const httpStatus = require('http-status');
const { AssetModelSparePart, AssetMaintenance, HistoryAssetMaintenanceSparePartModel } = require('../../models');
const ApiError = require('../../utils/ApiError');

/**
 * Create a user
 * @param {Object} category
 * @returns {Promise<User>}
 */
const createAssetModelSparePart = async (data) => {
    return AssetModelSparePart.create(data);
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
const queryAssetModelSpareParts = async (filter, options) => {
    const spareParts = await AssetModelSparePart.paginate(filter, options);
    return spareParts;
};

const getAssetModelSparePartById = async (id) => {
    return AssetModelSparePart.findById(id);
};

const updateAssetModelSparePartById = async (id, updateBody) => {
    const sparePart = await getAssetModelSparePartById(id);
    if (!sparePart) {
        throw new ApiError(httpStatus.NOT_FOUND, 'sparePart not found');
    }
    Object.assign(sparePart, updateBody);
    await sparePart.save();
    return sparePart;
};

const deleteAssetModelSparePartById = async (id) => {
    const sparePart = await getAssetModelSparePartById(id);
    if (!sparePart) {
        throw new ApiError(httpStatus.NOT_FOUND, 'sparePart not found');
    }
    const historys = await HistoryAssetMaintenanceSparePartModel.countDocuments({ assetMaintenance: id });
    await sparePart.remove();
    return sparePart;
};

const getAllAssetModelSparePart = async () => {
    const sparePartMaintenanceSpareParts = await AssetModelSparePart.find();
    return sparePartMaintenanceSpareParts;
};

const getResById = async (id) => {
    const sparePartMaintenanceMonitoringPoints = await AssetModelSparePart.find({
        assetModel: id,
    }).populate([
        {
            path: 'sparePart',
            populate: [{ path: 'spareCategoryId' }, { path: 'spareSubCategoryId' }, { path: 'manufacturer' }],
        },
    ]);
    return sparePartMaintenanceMonitoringPoints;
};
const getAssetModelSparePartByRes = async (data) => {
    const assetModelSpareParts = await AssetModelSparePart.find(data)
    return assetModelSpareParts;
};
module.exports = {
    queryAssetModelSpareParts,
    getAssetModelSparePartById,
    updateAssetModelSparePartById,
    deleteAssetModelSparePartById,
    createAssetModelSparePart,
    getAllAssetModelSparePart,
    getResById,
    getAssetModelSparePartByRes
};
