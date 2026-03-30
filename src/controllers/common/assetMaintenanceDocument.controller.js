const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const { assetMaintenanceDocumentService, resourceService } = require('../../services');
const ApiError = require('../../utils/ApiError');

/**
 * Create a user
 * @type {(function(*, *, *): void)|*}
 */
const createAssetMaintenanceDocument = catchAsync(async (req, res) => {
    const userId = req.user.id;

    const list = Array.isArray(req.body)
        ? req.body
        : Object.values(req.body);

    const data = list.map(item => ({
        ...item,
        createdBy: userId,
        updatedBy: userId,
    }));

    await assetMaintenanceDocumentService.createAssetMaintenance(data);

    res.status(httpStatus.CREATED).send({ code: 1 });
});


const getAssetMaintenanceDocumentById = catchAsync(async (req, res) => {
    const asset = await assetMaintenanceDocumentService.getAssetMaintenanceDocumentById(req.query.id);
    if (!asset) {
        throw new ApiError(httpStatus.NOT_FOUND, 'assetMaintenanceDocumentService not found');
    }
    res.send({ code: 1, data: asset });
});

/**
 * Update user by id.
 * @type {(function(*, *, *): void)|*}
 */
const updateAssetMaintenanceDocument = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body;
    const data = await assetMaintenanceDocumentService.getAssetMaintenanceDocumentById(id);
    if (data && data.resourceId && updateData.resourceId !== data.resourceId.id) {
        if (data.resourceId) {
            await resourceService.deleteResourceById(data.resourceId.id);
        }
    }
    await assetMaintenanceDocumentService.updateAssetMaintenanceDocumentById(id, updateData);
    res.send({ code: 1 });
});

/**
 * Delete user by id.
 * @type {(function(*, *, *): void)|*}
 */
const deleteAssetMaintenanceDocument = catchAsync(async (req, res) => {
    const assetMaintenance = await assetMaintenanceDocumentService.deleteAssetMaintenanceDocumentById(req.query.id);
    if (assetMaintenance.resourceId) {
        await resourceService.deleteResourceById(assetMaintenance.resourceId);
    }
    res.status(httpStatus.OK).send({ code: 1 });
});

const updateStatus = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body.data;
    const updated = await assetMaintenanceDocumentService.updateStatus(id, updateData);
    res.send({ code: 1, data: updated });
});

const getAllAssetMaintenanceDocument = catchAsync(async (req, res) => {
    const assets = await assetMaintenanceDocumentService.getAllAssetMaintenanceDocument();
    res.send({ code: 1, data: assets });
});

const getResById = catchAsync(async (req, res) => {
    const assets = await assetMaintenanceDocumentService.getResById(req.query.id);
    if (!assets) {
        throw new ApiError(httpStatus.NOT_FOUND, 'assetMaintenanceDocumentService not found');
    }
    res.send({ code: 1, data: assets });
});
module.exports = {
    createAssetMaintenanceDocument,
    getAssetMaintenanceDocumentById,
    updateAssetMaintenanceDocument,
    deleteAssetMaintenanceDocument,
    updateStatus,
    getAllAssetMaintenanceDocument,
    getResById,
};
