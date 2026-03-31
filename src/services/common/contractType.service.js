const httpStatus = require('http-status');
const { ContractTypeSchedule } = require('../../models');
const ApiError = require('../../utils/ApiError');

/**
 * Create a user
 * @param {Object} category
 * @returns {Promise<User>}
 */
const createContractType = async (category) => {
    return ContractTypeSchedule.create(category);
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
const queryContractTypes = async (_filter, options) => {
    const filter = { ..._filter };
    // Xử lý complianceType (kiểu số)
    if (filter.contractType) {
        const num = Number(filter.contractType);
        if (!Number.isNaN(num)) {
            filter.contractType = num;
        } else {
            delete filter.contractType;
        }
    }
    const assets = await ContractTypeSchedule.paginate(filter, options);
    return assets;
};

/**
 * Get user by id
 * @param {ObjectId} id
 * @returns {Promise<User>}
 */
const getContractTypeById = async (id) => {
    return ContractTypeSchedule.findById(id);
};

const updateContractTypeById = async (id, updateBody) => {
    const asset = await getContractTypeById(id);
    if (!asset) {
        throw new ApiError(httpStatus.NOT_FOUND, 'ContractType not found');
    }
    Object.assign(asset, updateBody);
    await asset.save();
    return asset;
};
const deleteContractTypeById = async (id) => {
    const asset = await getContractTypeById(id);
    if (!asset) {
        throw new ApiError(httpStatus.NOT_FOUND, 'ContractType not found');
    }
    await asset.remove();
    return asset;
};

const getAllContractType = async () => {
    const categorys = await ContractTypeSchedule.find();
    return categorys;
};
module.exports = {
    queryContractTypes,
    getContractTypeById,
    updateContractTypeById,
    deleteContractTypeById,
    createContractType,
    getAllContractType,
};
