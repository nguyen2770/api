const httpStatus = require('http-status');
const { Types } = require('mongoose');
const pick = require('../../utils/pick');
const catchAsync = require('../../utils/catchAsync');
const { manufacturerService } = require('../../services');
const ApiError = require('../../utils/ApiError');

/**
 * Create a user
 * @type {(function(*, *, *): void)|*}
 */
const createManufacturer = catchAsync(async (req, res) => {
    req.body = {
        ...req.body,
        // createdBy: req.user.id,
        // updatedBy: req.user.id,
    };
    const manufacturer = await manufacturerService.createManufacturer(req.body);
    res.status(httpStatus.CREATED).send({ code: 1, manufacturer });
});
const getManufacturers = catchAsync(async (req, res) => {
    const { manufacturerName, origin } = req.query
    const filter = {};
    if (manufacturerName && manufacturerName.trim()) {
        filter.manufacturerName = { $regex: manufacturerName, $options: 'i' };
    }
    if (origin) {
        filter.origin = Types.ObjectId(origin);
    }
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await manufacturerService.queryManufacturers(filter, options);
    // exchangeRequests.abc = 123;
    res.send({ results: result, code: 1 });
});
const getManufacturerById = catchAsync(async (req, res) => {
    const manufacturer = await manufacturerService.getManufacturerById(req.query.id);
    if (!manufacturer) {
        throw new ApiError(httpStatus.NOT_FOUND, 'manufacturer not found');
    }
    res.send({code: 1, manufacturer});
});
/**
 * Update user by id.
 * @type {(function(*, *, *): void)|*}
 */
const updateManufacturer = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body.manufacturer;
    // updateData.updatedBy = req.user.id; // Nếu cần
    const updated = await manufacturerService.updateManufacturerById(id, updateData);
    res.send({ code: 1, data: updated });
});
/**
 * Delete user by id.
 * @type {(function(*, *, *): void)|*}
 */
const deleteManufacturer = catchAsync(async (req, res) => {
    await manufacturerService.deleteManufactureById(req.query.id);
    res.status(httpStatus.OK).send({ code: 1 });
});
const updateStatus = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body.manufacturer;
    const updated = await manufacturerService.updateStatus(id, updateData);
    res.send({ code: 1, data: updated });
});
const getAllManufacturer = catchAsync(async (req, res) => {
    const manufacturers = await manufacturerService.getAllManufacturer();
    res.send({ code: 1, data: manufacturers });
});

module.exports = {
    createManufacturer,
    getManufacturers,
    getManufacturerById,
    getAllManufacturer,
    updateStatus,
    deleteManufacturer,
    updateManufacturer,
};
