const httpStatus = require('http-status');
const mongoose = require('mongoose');
const pick = require('../../utils/pick');
const catchAsync = require('../../utils/catchAsync');
const { returnToSupplierService } = require('../../services');
const ApiError = require('../../utils/ApiError');

/**
 * Create a receipt purchase
 */
const createReturnToSupplier = catchAsync(async (req, res) => {
    const ReturnToSupplier = await returnToSupplierService.createReturnToSupplier(req.body, req.user._id);
    res.status(httpStatus.CREATED).send({ code: 1, ReturnToSupplier });
});

const getReturnToSuppliers = catchAsync(async (req, res) => {
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
    const result = await returnToSupplierService.queryReturnToSupplier(filter, options);
    res.send({ results: result, code: 1 });
});

const getReturnToSupplierById = catchAsync(async (req, res) => {
    const ReturnToSupplier = await returnToSupplierService.getReturnToSupplierById(req.query.id);
    if (!ReturnToSupplier) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Receipt Purchase not found');
    }
    res.send({code: 1, ReturnToSupplier});
});


const updateReturnToSupplier = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body.ReturnToSupplier;
    // updateData.updatedBy = req.user.id;
    const updated = await returnToSupplierService.updateReturnToSupplierById(id, updateData, req.user._id);
    res.send({ code: 1, data: updated });
});

const deleteReturnToSupplier = catchAsync(async (req, res) => {
    await returnToSupplierService.deleteReturnToSupplierById(req.query.id);
    res.status(httpStatus.OK).send({ code: 1 });
});


const getAllReturnToSuppliers = catchAsync(async (req, res) => {
    const ReturnToSuppliers = await returnToSupplierService.getAllReturnToSupplier();
    res.send({ code: 1, data: ReturnToSuppliers });
});

const getReturnToSupplierDetailById = catchAsync(async (req, res) => {
    const ReturnToSupplierDetails = await returnToSupplierService.getReturnToSupplierDetailById(req.query.id);
    res.send({ code: 1, data: ReturnToSupplierDetails });
});

const getCurrentQty = catchAsync(async (req, res) => {
    const currentQty = await returnToSupplierService.getCurrentQty(req.query.id);
    res.send({...currentQty, code: 1})
})

module.exports = {
    createReturnToSupplier,
    getReturnToSuppliers,
    getReturnToSupplierById,
    updateReturnToSupplier,
    deleteReturnToSupplier,
    getAllReturnToSuppliers,
    getReturnToSupplierDetailById,
    getCurrentQty
};
