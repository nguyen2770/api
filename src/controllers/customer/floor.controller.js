const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const catchAsync = require('../../utils/catchAsync');
const { floorService } = require('../../services');
const ApiError = require('../../utils/ApiError');

/**
 * Create a user
 * @type {(function(*, *, *): void)|*}
 */

const createFloor = catchAsync(async (req, res) => {
    req.body = {
        ...req.body,
        // createdBy: req.user.id,
        // updatedBy: req.user.id,
    };
    const Floor = await floorService.createFloor(req.body);
    res.status(httpStatus.CREATED).send({ code: 1, Floor });
});
const getFloors = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['floorName']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await floorService.queryFloors(filter, options);
    // exchangeRequests.abc = 123;
    res.send({ results: result });
});

const getFloorById = catchAsync(async (req, res) => {
    const Floor = await floorService.getFloorById(req.query.id);
    if (!Floor) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Floor not found');
    }
    res.send(Floor);
});

/**
 * Update user by id.
 * @type {(function(*, *, *): void)|*}
 */
const updateFloor = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body.Floor;
    // updateData.updatedBy = req.user.id; // Nếu cần
    const updated = await floorService.updateFloorById(id, updateData);
    res.send({ code: 1, data: updated });
});

/**
 * Delete user by id.
 * @type {(function(*, *, *): void)|*}
 */
const deleteFloor = catchAsync(async (req, res) => {
    await floorService.deleteFloorById(req.query.id);
    res.status(httpStatus.OK).send({ code: 1 });
});

const updateStatus = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body.Floor;
    const updated = await floorService.updateStatus(id, updateData);
    res.send({ code: 1, data: updated });
});

const getAllFloor = catchAsync(async (req, res) => {
    const Floors = await floorService.getAllFloor();
    res.send({ code: 1, data: Floors });
});

module.exports = {
    createFloor,
    getFloors,
    getFloorById,
    updateFloor,
    deleteFloor,
    updateStatus,
    getAllFloor,
};
