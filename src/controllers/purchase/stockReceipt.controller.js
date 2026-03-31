const httpStatus = require('http-status');
const mongoose = require('mongoose');
const pick = require('../../utils/pick');
const catchAsync = require('../../utils/catchAsync');
const { stockReceiptService, sequenceService } = require('../../services');
const ApiError = require('../../utils/ApiError');

/**
 * Create a stock receipt
 */
const createStockReceipt = catchAsync(async (req, res) => {

    req.body = {
        ...req.body,
        stockReceipt: {
            ...req.body.stockReceipt,
            createdBy: req.user.id,
            updatedBy: req.user.id,
            code: await sequenceService.generateSequenceCode('STOCK_RECEIPT'),
        }
    }
    const receiptPurchase = await stockReceiptService.createStockReceipt(req.body);
    res.status(httpStatus.CREATED).send({ code: 1, receiptPurchase });
});

const getStockReceipts = catchAsync(async (req, res) => {
    const { code, branch, department, startDate, endDate, state } = req.query;
    const filter = {};

    if (code && code.trim()) {
        filter.code = { $regex: code, $options: 'i' };
    }

    if (state && state.trim()) {
        filter.state = { $regex: state, $options: 'i' };
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
    const result = await stockReceiptService.queryStockReceipt(filter, options);
    res.send({ results: result, code:1 });
});

const getStockReceiptById = catchAsync(async (req, res) => {
    const stockReceipt = await stockReceiptService.getStockReceiptById(req.query.id);
    if (!stockReceipt) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Stock Receipt not found');
    }
    res.send({code: 1,stockReceipt});
});

/**
 * Update stock receipt by id
 */
const updateStockReceipt = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body;
    updateData.updatedBy = req.user.id;
    const updated = await stockReceiptService.updateStockReceiptById(id, updateData);
    res.send({ code: 1, data: updated });
});

/**
 * Delete stock receipt by id
 */
const deleteStockReceipt = catchAsync(async (req, res) => {
    await stockReceiptService.deleteStockReceiptById(req.query.id);
    res.status(httpStatus.OK).send({ code: 1 });
});


const getAllStockReceipts = catchAsync(async (req, res) => {
    const stockReceipts = await stockReceiptService.getAllStockReceipt();
    res.send({ code: 1, data: stockReceipts });
});

const getStockReceiptDetailById = catchAsync(async (req, res) => {
    const stockReceiptDetails = await stockReceiptService.getStockReceiptDetailById(req.query.id);
    res.send({ code: 1, data: stockReceiptDetails });
});

const approve = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body;
    updateData.updatedBy = req.user.id;
    const approve = await stockReceiptService.approveStockReceipt(id, updateData);
    res.send({ code: 1, data: approve })
})

module.exports = {
    createStockReceipt,
    getStockReceipts,
    getStockReceiptById,
    updateStockReceipt,
    deleteStockReceipt,
    getAllStockReceipts,
    getStockReceiptDetailById,
    approve,
};
