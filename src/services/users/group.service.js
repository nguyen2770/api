const httpStatus = require('http-status');
const { Group } = require('../../models');
const ApiError = require('../../utils/ApiError');

/**
 * Create a user
 * @param {Object} category
 * @returns {Promise<User>}
 */
const createGroup = async (category) => {
    return Group.create(category);
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
const queryGroups = async (filter, options) => {
    const groups = await Group.paginate(filter, options);
    return groups;
};

/**
 * Get user by id
 * @param {ObjectId} id
 * @returns {Promise<User>}
 */
const getGroupById = async (id) => {
    return Group.findById(id);
};

const updateGroupById = async (id, updateBody) => {
    const group = await getGroupById(id);
    if (!group) {
        throw new ApiError(httpStatus.NOT_FOUND, 'group not found');
    }
    Object.assign(group, updateBody);
    await group.save();
    return group;
};
const updateStatus = async (id, updateBody) => {
    const group = await getGroupById(id);
    if (!group) {
        throw new ApiError(httpStatus.NOT_FOUND, 'group not found');
    }
    Object.assign(group, updateBody);
    await group.save();
    return group;
};
const deleteGroupById = async (id) => {
    const group = await getGroupById(id);
    if (!group) {
        throw new ApiError(httpStatus.NOT_FOUND, 'group not found');
    }
    await group.remove();
    return group;
};

const getAllGroup = async () => {
    const groups = await Group.find();
    return groups;
};
module.exports = {
    queryGroups,
    getGroupById,
    updateGroupById,
    deleteGroupById,
    createGroup,
    updateStatus,
    getAllGroup,
};
