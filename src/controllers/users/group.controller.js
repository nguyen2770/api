const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const catchAsync = require('../../utils/catchAsync');
const { groupService } = require('../../services');
const ApiError = require('../../utils/ApiError');

/**
 * Create a user
 * @type {(function(*, *, *): void)|*}
 */

const createGroup = catchAsync(async (req, res) => {
    req.body = {
        ...req.body,
        // createdBy: req.user.id,
        // updatedBy: req.user.id,
    };
    const group = await groupService.createGroup(req.body);
    res.status(httpStatus.CREATED).send({ code: 1, group });
});
const getGroups = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['name']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await groupService.queryGroups(filter, options);
    // exchangeRequests.abc = 123;
    res.send({ results: result });
});

const getGroupById = catchAsync(async (req, res) => {
    const group = await groupService.getGroupById(req.query.id);
    if (!group) {
        throw new ApiError(httpStatus.NOT_FOUND, 'group not found');
    }
    res.send(group);
});

/**
 * Update user by id.
 * @type {(function(*, *, *): void)|*}
 */
const updateGroup= catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body.group;
    // updateData.updatedBy = req.user.id; // Nếu cần
    const updated = await groupService.updateGroupById(id, updateData);
    res.send({ code: 1, data: updated });
});

/**
 * Delete user by id.
 * @type {(function(*, *, *): void)|*}
 */
const deleteGroup = catchAsync(async (req, res) => {
    await groupService.deleteGroupById(req.query.id);
    res.status(httpStatus.OK).send({ code: 1 });
});

const updateStatus = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body.group;
    const updated = await groupService.updateStatus(id, updateData);
    res.send({ code: 1, data: updated });
});

const getAllGroup= catchAsync(async (req, res) => {
    const groups = await groupService.getAllGroup();
    res.send({ code: 1, data: groups });
});
module.exports = {
    createGroup,
    getGroups,
    getGroupById,
    updateGroup,
    deleteGroup,
    updateStatus,
    getAllGroup,
};
