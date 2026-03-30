const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const catchAsync = require('../../utils/catchAsync');
const { supplierService } = require('../../services');
const ApiError = require('../../utils/ApiError');

/**
 * Create a user
 * @type {(function(*, *, *): void)|*}
 */
const createSupplier = catchAsync(async (req, res) => {
    req.body = {
        ...req.body,
        // createdBy: req.user.id,
        // updatedBy: req.user.id,
    };
    const Supplier = await supplierService.createSupplier(req.body);
    res.status(httpStatus.CREATED).send({ code: 1, Supplier });
});
const getSuppliers = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['email', 'phoneNumber', 'address', 'supplierName', 'searchText']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await supplierService.querySuppliers(filter, options);
    // exchangeRequests.abc = 123;
    res.send({ results: result, code : 1 });
});
const getSupplierById = catchAsync(async (req, res) => {
    const Supplier = await supplierService.getSupplierById(req.query.id);
    if (!Supplier) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Supplier not found');
    }
    res.send({code: 1,Supplier});
});
/**
 * Update user by id.
 * @type {(function(*, *, *): void)|*}
 */
const updateSupplier = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body.Supplier;
    // updateData.updatedBy = req.user.id; // Nếu cần
    const updated = await supplierService.updateSupplierById(id, updateData);
    res.send({ code: 1, data: updated });
});
/**
 * Delete user by id.
 * @type {(function(*, *, *): void)|*}
 */
const deleteSupplier = catchAsync(async (req, res) => {
    await supplierService.deleteSupplierById(req.query.id);
    res.status(httpStatus.OK).send({ code: 1 });
});
const updateStatus = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body.Supplier;
    const updated = await supplierService.updateStatus(id, updateData);
    res.send({ code: 1, data: updated });
});
const getAllSupplier = catchAsync(async (req, res) => {
    const suppliers = await supplierService.getAllSupplier();
    res.send({ code: 1, data: suppliers });
});

const uploadSupplierExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.send({ code: 0, message: "Not file" })
        }
        const result = await supplierService.uploadSupplierExcel(req.file.path, req.file)
        return res.send({ code: 1, result })
    } catch (error) {
        return res.send({ code: 0, message: error.message || "Tải file lên không thành công" })
    }
};

module.exports = {
    createSupplier,
    getSuppliers,
    getSupplierById,
    getAllSupplier,
    updateStatus,
    deleteSupplier,
    updateSupplier,
    uploadSupplierExcel,
};
