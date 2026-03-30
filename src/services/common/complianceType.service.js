const httpStatus = require('http-status');
const { ComplianceTypeSchedule } = require('../../models');
const ApiError = require('../../utils/ApiError');

/**
 * Create a user
 * @param {Object} category
 * @returns {Promise<User>}
 */
const createComplianceType = async (category) => {
    return ComplianceTypeSchedule.create(category);
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
const queryComplianceTypes = async (_filter, options) => {
    const filter = { ..._filter };
    // Xử lý complianceType (kiểu số)
    if (filter.complianceType) {
        const num = Number(filter.complianceType);
        if (!Number.isNaN(num)) {
            filter.complianceType = num;
        } else {
            delete filter.complianceType;
        }
    }

    const assets = await ComplianceTypeSchedule.paginate(filter, {
        ...options,
        populate: {
            path: 'contractTypeId',
            select: 'contractTypeName',
        },
    });
    return assets;
};
/**
 * Get user by id
 * @param {ObjectId} id
 * @returns {Promise<User>}
 */
const getComplianceTypeById = async (id) => {
    return ComplianceTypeSchedule.findById(id);
};

const updateComplianceTypeById = async (id, updateBody) => {
    const asset = await getComplianceTypeById(id);
    if (!asset) {
        throw new ApiError(httpStatus.NOT_FOUND, 'ComplianceType not found');
    }
    Object.assign(asset, updateBody);
    await asset.save();
    return asset;
};

const deleteComplianceTypeById = async (id) => {
    const asset = await getComplianceTypeById(id);
    if (!asset) {
        throw new ApiError(httpStatus.NOT_FOUND, 'ComplianceType not found');
    }
    await asset.remove();
    return asset;
};

const getAllComplianceType = async () => {
    const categorys = await ComplianceTypeSchedule.find();
    return categorys;
};
module.exports = {
    queryComplianceTypes,
    getComplianceTypeById,
    updateComplianceTypeById,
    deleteComplianceTypeById,
    createComplianceType,
    getAllComplianceType,
};
