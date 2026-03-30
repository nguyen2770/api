const httpStatus = require('http-status');
const mongoose = require('mongoose');
const pick = require('../../utils/pick');
const catchAsync = require('../../utils/catchAsync');
const { purchaseOrdersService, sequenceService } = require('../../services');
const ApiError = require('../../utils/ApiError');

/**
 * Create a user
 * @type {(function(*, *, *): void)|*}
 */

const createPurchaseOrders = catchAsync(async (req, res) => {
    req.body = {
        ...req.body,
        purchaseOrders: {
            ...req.body.purchaseOrders,
            createdBy: req.user.id,
            updatedBy: req.user.id,
            code: await sequenceService.generateSequenceCode('PURCHASE_ORDER'),
        }
    }
    const PurchaseOrders = await purchaseOrdersService.createPurchaseOrders(req.body);
    res.status(httpStatus.CREATED).send({ code: 1, PurchaseOrders });
});
const getPurchaseOrders = catchAsync(async (req, res) => {
    const { code, branch, department, startDate, endDate } = req.query;
    const filter = {};

    if (code && code.trim()) {
        filter.code = { $regex: code, $options: 'i' };
    }

    if (branch && branch.trim()) {
        filter.branch = new mongoose.Types.ObjectId(branch);
    }

    if (department && department.trim()) {
        filter.department = new mongoose.Types.ObjectId(department);
    }

    if (startDate && startDate.trim()) {
        filter.createdAt = filter.createdAt || {};
        filter.createdAt.$gte = new Date(startDate);
    }

    if (endDate && endDate.trim()) {
        filter.createdAt = filter.createdAt || {};
        filter.createdAt.$lte = new Date(endDate);
    }


    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await purchaseOrdersService.queryPurchaseOrders(filter, options);
    // exchangeRequests.abc = 123;
    res.send({ results: result , code: 1});
});

const getPurchaseOrdersById = catchAsync(async (req, res) => {
    const PurchaseOrders = await purchaseOrdersService.getPurchaseOrdersById(req.query.id);
    if (!PurchaseOrders) {
        throw new ApiError(httpStatus.NOT_FOUND, 'PurchaseOrders not found');
    }
    res.send({code: 1});
});

/**
 * Update user by id.
 * @type {(function(*, *, *): void)|*}
 */
const updatePurchaseOrders = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body.PurchaseOrders;
    // updateData.updatedBy = req.user.id; // Nếu cần
    const updated = await purchaseOrdersService.updatePurchaseOrdersById(id, updateData, req.user._id);
    res.send({ code: 1, data: updated });
});

/**
 * Delete user by id.
 * @type {(function(*, *, *): void)|*}
 */
const deletePurchaseOrders = catchAsync(async (req, res) => {
    await purchaseOrdersService.deletePurchaseOrdersById(req.query.id);
    res.status(httpStatus.OK).send({ code: 1 });
});

const updateStatus = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body.PurchaseOrders;
    const updated = await purchaseOrdersService.updateStatus(id, updateData, req.user._id);
    res.send({ code: 1, data: updated });
});

const getAllPurchaseOrders = catchAsync(async (req, res) => {
    const PurchaseOrders = await purchaseOrdersService.getAllPurchaseOrders();
    res.send({ code: 1, data: PurchaseOrders });
});

const getPurchaseOrdersDetailById = catchAsync(async (req, res) => {
    const PurchaseOrders = await purchaseOrdersService.getPurchaseOrdersDetailById(req.query.id);
    res.send({ code: 1, data: PurchaseOrders });
});

const getPurchaseOrdersDetail = catchAsync(async (req, res) => {
    const PurchaseOrdersDetail = await purchaseOrdersService.getPurchaseOrdersDetail(req.query.id);
    if (!PurchaseOrdersDetail) {
        throw new ApiError(httpStatus.NOT_FOUND, 'PurchaseOrdersDetail not found');
    }
    res.send({code: 1, PurchaseOrdersDetail});
});


module.exports = {
    createPurchaseOrders,
    getPurchaseOrders,
    getPurchaseOrdersById,
    updatePurchaseOrders,
    deletePurchaseOrders,
    updateStatus,
    getAllPurchaseOrders,
    getPurchaseOrdersDetailById,
    getPurchaseOrdersDetail
};
