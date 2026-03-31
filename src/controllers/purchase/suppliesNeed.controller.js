const httpStatus = require('http-status');
const mongoose = require('mongoose');
const pick = require('../../utils/pick');
const catchAsync = require('../../utils/catchAsync');
const { suppliesNeedService, sequenceService, approvalTaskService } = require('../../services');
const ApiError = require('../../utils/ApiError');

/**
 * Create a user
 * @type {(function(*, *, *): void)|*}
 */

const createSuppliesNeed = catchAsync(async (req, res) => {
    req.body = {
        ...req.body,
        suppliesNeed: {
            ...req.body.suppliesNeed,
            createdBy: req.user.id,
            updatedBy: req.user.id,
            code: await sequenceService.generateSequenceCode('SUPPLIES_NEED'),
        }
    }
    const SuppliesNeed = await suppliesNeedService.createSuppliesNeed(req.body);

    res.status(httpStatus.CREATED).send({ code: 1, SuppliesNeed });
});
const getSuppliesNeeds = catchAsync(async (req, res) => {
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
    const result = await suppliesNeedService.querySuppliesNeeds(filter, options);
    // exchangeRequests.abc = 123;
    res.send({ results: result , code: 1});
});

const getSuppliesNeedById = catchAsync(async (req, res) => {
    const SuppliesNeed = await suppliesNeedService.getSuppliesNeedById(req.query.id);
    if (!SuppliesNeed) {
        throw new ApiError(httpStatus.NOT_FOUND, 'SuppliesNeed not found');
    }
    res.send({code: 1,SuppliesNeed});
});

/**
 * Update user by id.
 * @type {(function(*, *, *): void)|*}
 */
const updateSuppliesNeed = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body.SuppliesNeed;
    // updateData.updatedBy = req.user.id; // Nếu cần
    const updated = await suppliesNeedService.updateSuppliesNeedById(id, updateData, req.user._id);
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
const deleteSuppliesNeed = catchAsync(async (req, res) => {
    await suppliesNeedService.deleteSuppliesNeedById(req.query.id);
    res.status(httpStatus.OK).send({ code: 1 });
});

const updateAction = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body.SuppliesNeed;
    const updated = await suppliesNeedService.updateAction(id, updateData, req.user._id);
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

const getAllSuppliesNeed = catchAsync(async (req, res) => {
    const SuppliesNeeds = await suppliesNeedService.getAllSuppliesNeed();
    res.send({ code: 1, data: SuppliesNeeds });
});

const getSuppliesNeedDetailById = catchAsync(async (req, res) => {
    const RequestPurchases = await suppliesNeedService.getSuppliesNeedDetailById(req.query.id);
    res.send({ code: 1, data: RequestPurchases });
});

module.exports = {
    createSuppliesNeed,
    getSuppliesNeeds,
    getSuppliesNeedById,
    updateSuppliesNeed,
    deleteSuppliesNeed,
    updateAction,
    getAllSuppliesNeed,
    getSuppliesNeedDetailById
};
