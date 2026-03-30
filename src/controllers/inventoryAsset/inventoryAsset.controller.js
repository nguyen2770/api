const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const catchAsync = require('../../utils/catchAsync');
const InventoryAssetService = require('../../services/inventoryAsset/inventoryAsset.service');
const ApiError = require('../../utils/ApiError');
const { inventoryAssetStatus, inventoryAssetDepartmentStatus } = require('../../utils/constant');

/**
 * Create a user
 * @type {(function(*, *, *): void)|*}
 */

const createInventoryAsset = catchAsync(async (req, res) => {
    var inventoryAssetCreate = req.body.inventoryAsset;
    var inventoryAssetDepartments = req.body.inventoryAssetDepartments;
    inventoryAssetCreate.createdBy = req.user.id;
    if (inventoryAssetCreate.isConfirm) {
        inventoryAssetCreate.status = inventoryAssetStatus.new;
        inventoryAssetDepartments.forEach(element => {
            element.status = inventoryAssetDepartmentStatus.assigned;
        });
    }
    const _inventoryAsset = await InventoryAssetService.createInventoryAsset(inventoryAssetCreate, inventoryAssetDepartments);
    res.status(httpStatus.CREATED).send({ code: 1, inventoryAsset: _inventoryAsset });
});
const confirmInventoryAsset = catchAsync(async (req, res) => {

    const _inventoryAsset = await InventoryAssetService.confirmInventoryAsset(req.body.id);
    res.status(httpStatus.CREATED).send({ code: 1, inventoryAsset: _inventoryAsset, messsage: "Xác nhận lịch kiểm kê thành công!" });
});
const confirmInventoryAssetDepartment = catchAsync(async (req, res) => {
    const inventoryAssetDepartment = await InventoryAssetService.confirmInventoryAssetDepartment(req.body.id);
    res.status(httpStatus.CREATED).send({ code: 1, inventoryAssetDepartment: inventoryAssetDepartment, messsage: "Xác nhận lịch kiểm kê thành công!" });
});
const sendAssetMaintenances = catchAsync(async (req, res) => {
    const inventoryAssetDepartmentAssetMaintenances = req.body.inventoryAssetDepartmentAssetMaintenances;
    const inventoryAssetDepartment = req.body.inventoryAssetDepartment;
    await InventoryAssetService.sendAssetMaintenances(inventoryAssetDepartment.id, inventoryAssetDepartmentAssetMaintenances);
    res.status(httpStatus.CREATED).send({ code: 1, messsage: "Xác nhận lịch kiểm kê thành công!" });
});
const getInventoryAssets = catchAsync(async (req, res) => {
    const filter = pick(req.query, []);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await InventoryAssetService.queryInventoryAssets(filter, options);
    // exchangeRequests.abc = 123;
    res.send({ results: result, code: 1 });
});
const getMyInventoryAssets = catchAsync(async (req, res) => {
    const filter = pick(req.query, []);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await InventoryAssetService.getMyInventoryAssets(filter, options);
    // exchangeRequests.abc = 123;
    res.send({ results: result, code: 1 });
});
const getInventoryAssetById = catchAsync(async (req, res) => {
    const inventoryAsset = await InventoryAssetService.getInventoryAssetById(req.query.id);
    if (!inventoryAsset) {
        throw new ApiError(httpStatus.NOT_FOUND, 'InventoryAsset not found');
    }
    const inventoryAssetDepartments = await InventoryAssetService.getInventoryAssetDepartmentsByIadId(req.query.id);
    res.send({
        data: {
            inventoryAsset, inventoryAssetDepartments
        }, code: 1
    });
});
const getInventoryAssetDepartmentById = catchAsync(async (req, res) => {
    const inventoryAssetDepartment = await InventoryAssetService.getInventoryAssetDepartmentById(req.query.id);
    if (!inventoryAssetDepartment) {
        throw new ApiError(httpStatus.NOT_FOUND, 'InventoryAsset not found');
    }
    const inventoryAsset = await InventoryAssetService.getInventoryAssetById(inventoryAssetDepartment.inventoryAsset);
    if (!inventoryAsset) {
        throw new ApiError(httpStatus.NOT_FOUND, 'InventoryAsset not found');
    }
    const inventoryAssetDepartmentAssetMaintenances = await InventoryAssetService.getInventoryAssetDepartmentAssetMaintenancesByIadId(req.query.id);
    res.send({
        data: {
            inventoryAssetDepartment,
            inventoryAsset,
            inventoryAssetDepartmentAssetMaintenances
        }, code: 1
    });
});
/**
 * Update user by id.
 * @type {(function(*, *, *): void)|*}
 */
const updateInventoryAsset = catchAsync(async (req, res) => {
    var inventoryAssetUpdate = req.body.inventoryAsset;
    var inventoryAssetDepartments = req.body.inventoryAssetDepartments;
    // updateData.updatedBy = req.user.id; // Nếu cần
    const updated = await InventoryAssetService.updateInventoryAssetById(req.body.id, inventoryAssetUpdate, inventoryAssetDepartments);
    res.send({ code: 1, data: updated });
});

/**
 * Delete user by id.
 * @type {(function(*, *, *): void)|*}
 */
const deleteInventoryAsset = catchAsync(async (req, res) => {
    await InventoryAssetService.deleteInventoryAssetById(req.query.id);
    res.status(httpStatus.OK).send({ code: 1 });
});

const updateStatus = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body.InventoryAsset;
    const updated = await InventoryAssetService.updateStatus(id, updateData);
    res.send({ code: 1, data: updated });
});

const getAllInventoryAsset = catchAsync(async (req, res) => {
    const InventoryAssets = await InventoryAssetService.getAllInventoryAsset();
    res.send({ code: 1, data: InventoryAssets });
});

module.exports = {
    createInventoryAsset,
    confirmInventoryAsset,
    getInventoryAssets,
    getInventoryAssetById,
    getMyInventoryAssets,
    updateInventoryAsset,
    deleteInventoryAsset,
    updateStatus,
    getAllInventoryAsset,
    getInventoryAssetDepartmentById,
    confirmInventoryAssetDepartment,
    sendAssetMaintenances
};
