const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const catchAsync = require('../../utils/catchAsync');
const { suppliesNeedSparePartService } = require('../../services');
const ApiError = require('../../utils/ApiError');

/**
 * Create a user
 * @type {(function(*, *, *): void)|*}
 */

const createSuppliesNeedSparePart = catchAsync(async (req, res) => {
    req.body = {
        ...req.body,
        // createdBy: req.user.id,
        // updatedBy: req.user.id,
    };
    const SuppliesNeedSparePart = await suppliesNeedSparePartService.createSuppliesNeedSparePart(req.body);
    res.status(httpStatus.CREATED).send({ code: 1, SuppliesNeedSparePart });
});
const getSuppliesNeedSpareParts = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['name']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await suppliesNeedSparePartService.querySuppliesNeedSpareParts(filter, options);
    // exchangeRequests.abc = 123;
    res.send({ results: result, code :1 });
});

const getSuppliesNeedSparePartById = catchAsync(async (req, res) => {
    const SuppliesNeedSparePart = await suppliesNeedSparePartService.getSuppliesNeedSparePartById(req.query.id);
    if (!SuppliesNeedSparePart) {
        throw new ApiError(httpStatus.NOT_FOUND, 'SuppliesNeedSparePart not found');
    }
    res.send({code: 1, SuppliesNeedSparePart});
});

/**
 * Update user by id.
 * @type {(function(*, *, *): void)|*}
 */
const updateSuppliesNeedSparePart= catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body.SuppliesNeedSparePart;
    // updateData.updatedBy = req.user.id; // Nếu cần
    const updated = await suppliesNeedSparePartService.updateSuppliesNeedSparePartById(id, updateData);
    res.send({ code: 1, data: updated });
});

/**
 * Delete user by id.
 * @type {(function(*, *, *): void)|*}
 */
const deleteSuppliesNeedSparePart = catchAsync(async (req, res) => {
    await suppliesNeedSparePartService.deleteSuppliesNeedSparePartById(req.query.id);
    res.status(httpStatus.OK).send({ code: 1 });
});

const updateStatus = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body.SuppliesNeedSparePart;
    const updated = await suppliesNeedSparePartService.updateStatus(id, updateData);
    res.send({ code: 1, data: updated });
});

const getAllSuppliesNeedSparePart= catchAsync(async (req, res) => {
    const SuppliesNeedSpareParts = await suppliesNeedSparePartService.getAllSuppliesNeedSparePart();
    res.send({ code: 1, data: SuppliesNeedSpareParts });
});

const getSuppliesNeedSparePartBySuppliesNeed = catchAsync(async (req, res) => {
    const SuppliesNeedSparePart = await suppliesNeedSparePartService.getSuppliesNeedSparePartBySuppliesNeed(req.query.id);
    if (!SuppliesNeedSparePart) {
        throw new ApiError(httpStatus.NOT_FOUND, 'SuppliesNeedSparePart not found');
    }
    res.send({code: 1, SuppliesNeedSparePart});
});
module.exports = {
    createSuppliesNeedSparePart,
    getSuppliesNeedSpareParts,
    getSuppliesNeedSparePartById,
    updateSuppliesNeedSparePart,
    deleteSuppliesNeedSparePart,
    updateStatus,
    getAllSuppliesNeedSparePart,
    getSuppliesNeedSparePartBySuppliesNeed
};
