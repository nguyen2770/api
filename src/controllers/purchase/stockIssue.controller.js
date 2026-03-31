const httpStatus = require('http-status');
const mongoose = require('mongoose');
const pick = require('../../utils/pick');
const catchAsync = require('../../utils/catchAsync');
const { stockIssueService, sequenceService } = require('../../services');
const ApiError = require('../../utils/ApiError');

/**
 * Create a receipt purchase
 */
const createStockIssue = catchAsync(async (req, res) => {
    req.body = {
        ...req.body,
        stockIssue: {
            ...req.body.stockIssue,
            createdBy: req.user.id,
            updatedBy: req.user.id,
            code: await sequenceService.generateSequenceCode('STOCK_ISSUE'),
        }
    }
    const receiptIssue = await stockIssueService.createStockIssue(req.body);
    res.status(httpStatus.CREATED).send({ code: 1, receiptIssue });
});

const queryStockIssue = catchAsync(async (req, res) => {
    const { code, branch, department, startDate, endDate, action, exportType } = req.query;
    const filter = {};

    if (code && code.trim()) {
        filter.code = { $regex: code, $options: 'i' };
    }

    if (exportType && exportType.trim()) {
        filter.exportType = { $regex: exportType, $options: 'i' };
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
    const result = await stockIssueService.queryStockIssue(filter, options);
    res.send({ results: result , code: 1});
});

const getStockIssueById = catchAsync(async (req, res) => {
    const receiptIssue = await stockIssueService.getStockIssueById(req.query.id);
    if (!receiptIssue) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Receipt Purchase not found');
    }
    res.send({code : 1,receiptIssue});
});

/**
 * Update receipt purchase by id
 */
const updateStockIssueById = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body;
    const updated = await stockIssueService.updateStockIssueById(id, updateData);
    res.send({ code: 1, data: updated });
});

/**
 * Delete receipt purchase by id
 */
const deleteStockIssueById = catchAsync(async (req, res) => {
    await stockIssueService.deleteStockIssueById(req.query.id);
    res.status(httpStatus.OK).send({ code: 1 });
});


const getAllReceiptIssue = catchAsync(async (req, res) => {
    const ReceiptIssues = await stockIssueService.getAllReceiptIssue();
    res.send({ code: 1, data: ReceiptIssues });
});

const getReceiptStockIssueDetailById = catchAsync(async (req, res) => {
    const ReceiptIssueDetails = await stockIssueService.getReceiptStockIssueDetailById(req.query.id);
    res.send({ code: 1, data: ReceiptIssueDetails });
});

// const getCurrentQty = catchAsync(async (req, res) => {
//     const currentQty = await stockIssueService.getCurrentQty(req.query.id);
//     res.send({ ...currentQty })
// })

const approve = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body;
    updateData.updatedBy = req.user.id;
    const approve = await stockIssueService.approve(id, updateData);
    res.send({ code: 1, data: approve })
})

module.exports = {
    createStockIssue,
    queryStockIssue,
    getStockIssueById,
    getStockIssueById,
    updateStockIssueById,
    deleteStockIssueById,
    getReceiptStockIssueDetailById,
    getAllReceiptIssue,
    getAllReceiptIssue,
    approve,
    // getCurrentQty
};
