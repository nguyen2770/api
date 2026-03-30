const httpStatus = require('http-status');
const mongoose = require('mongoose');
const pick = require('../../utils/pick');
const catchAsync = require('../../utils/catchAsync');
const { requestPurchaseService, sequenceService, approvalTaskService } = require('../../services');
const ApiError = require('../../utils/ApiError');

/**
 * Create a user
 * @type {(function(*, *, *): void)|*}
 */

const createRequestPurchase = catchAsync(async (req, res) => {
    req.body = {
        ...req.body,
        requestPurchase: {
            ...req.body.requestPurchase,
            createdBy: req.user.id,
            updatedBy: req.user.id,
            code: await sequenceService.generateSequenceCode('PURCHASE_REQUEST'),
        }
    }
    const RequestPurchase = await requestPurchaseService.createRequestPurchase(req.body);
    res.status(httpStatus.CREATED).send({ code: 1, RequestPurchase });
});
const getRequestPurchases = catchAsync(async (req, res) => {
    const { code, branch, department, startDate, endDate, action } = req.query;
    const filter = {};

    if (code && code.trim()) {
        filter.code = { $regex: code, $options: 'i' };
    }

    if (action && action.trim()) {
        filter.action = { $regex: action, $options: 'i' };
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
    const result = await requestPurchaseService.queryRequestPurchases(filter, options);
    // exchangeRequests.abc = 123;
    res.send({ results: result, code: 1 });
});

const getRequestPurchaseById = catchAsync(async (req, res) => {
    const RequestPurchase = await requestPurchaseService.getRequestPurchaseById(req.query.id);
    if (!RequestPurchase) {
        throw new ApiError(httpStatus.NOT_FOUND, 'RequestPurchase not found');
    }
    res.send({code: 1, RequestPurchase});
});

/**
 * Update user by id.
 * @type {(function(*, *, *): void)|*}
 */
const updateRequestPurchase = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body.RequestPurchase;
    // updateData.updatedBy = req.user.id; // Nếu cần
    const updated = await requestPurchaseService.updateRequestPurchaseById(id, updateData, req.user._id);
    if (updated && updateData.action !== "pendingApproval") {
        const payload = {
            processedAt: new Date(),
            processedBy: req.user.id,
            status: "PROCESSED"
        }
        await approvalTaskService.updateApprovalTask(req.body.id, payload);

    }
    res.send({ code: 1, data: updated });
});

/**
 * Delete user by id.
 * @type {(function(*, *, *): void)|*}
 */
const deleteRequestPurchase = catchAsync(async (req, res) => {
    await requestPurchaseService.deleteRequestPurchaseById(req.query.id);
    res.status(httpStatus.OK).send({ code: 1 });
});

const updateStatus = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body.RequestPurchase;
    const updated = await requestPurchaseService.updateStatus(id, updateData, req.user._id);
    console.log(updateData)

    if (updated && updateData.action !== "pendingApproval") {
        const payload = {
            processedAt: new Date(),
            processedBy: req.user.id,
            status: "PROCESSED"
        }
        await approvalTaskService.updateApprovalTaskBySourceId(id, payload);

    }
    res.send({ code: 1, data: updated });
});

const getAllRequestPurchase = catchAsync(async (req, res) => {
    const RequestPurchases = await requestPurchaseService.getAllRequestPurchase();
    res.send({ code: 1, data: RequestPurchases });
});

const getRequestPurchasesDetailById = catchAsync(async (req, res) => {
    const RequestPurchases = await requestPurchaseService.getRequestPurchasesDetailById(req.query.id);
    res.send({ code: 1, data: RequestPurchases });
});

module.exports = {
    createRequestPurchase,
    getRequestPurchases,
    getRequestPurchaseById,
    updateRequestPurchase,
    deleteRequestPurchase,
    updateStatus,
    getAllRequestPurchase,
    getRequestPurchasesDetailById
};
