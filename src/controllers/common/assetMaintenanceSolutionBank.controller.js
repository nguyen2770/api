const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const { assetMaintenanceSolutionBankService, assetMaintenanceDefectService } = require('../../services');
const ApiError = require('../../utils/ApiError');

/**
 * Create a user
 * @type {(function(*, *, *): void)|*}
 */
const createAssetMaintenanceSolutionBank = catchAsync(async (req, res) => {
    const data = {
        ...req.body,
        // createdBy: req.user.id,
        // updatedBy: req.user.id,
    };
    const defect = await assetMaintenanceDefectService.getAssetMaintenanceDefectById(data.assetMaintenanceDefectId);
    if (defect) {
        const payload = {
            defectTags: data.defectTags,
        };
        await assetMaintenanceDefectService.updateAssetMaintenanceDefectById(data.assetMaintenanceDefectId, payload);
    }
    const asset = await assetMaintenanceSolutionBankService.createAssetMaintenanceSolutionBank(data);
    res.status(httpStatus.CREATED).send({ code: 1, data: asset });
});

const getAssetMaintenanceSolutionBankById = catchAsync(async (req, res) => {
    const asset = await assetMaintenanceSolutionBankService.getAssetMaintenanceSolutionBankById(req.query.id);
    if (!asset) {
        throw new ApiError(httpStatus.NOT_FOUND, 'assetMaintenanceSolutionBankService not found');
    }
    res.send({ code: 1, data: asset });
});

/**
 * Update user by id.
 * @type {(function(*, *, *): void)|*}
 */
const updateAssetMaintenanceSolutionBank = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body.data;
    // updateData.updatedBy = req.user.id; // Nếu cần
    const defect = await assetMaintenanceDefectService.getAssetMaintenanceDefectById(updateData.assetMaintenanceDefectId);
    if (defect) {
        const payload = {
            defectTags: updateData.defectTags,
        };
        await assetMaintenanceDefectService.updateAssetMaintenanceDefectById(updateData.assetMaintenanceDefectId, payload);
    }
    const updated = await assetMaintenanceSolutionBankService.updateAssetMaintenanceSolutionBankById(id, updateData);
    res.send({ code: 1, data: updated });
});

/**
 * Delete user by id.
 * @type {(function(*, *, *): void)|*}
 */
const deleteAssetMaintenanceSolutionBank = catchAsync(async (req, res) => {
    await assetMaintenanceSolutionBankService.deleteAssetMaintenanceSolutionBankById(req.query.id);
    res.status(httpStatus.OK).send({ code: 1 });
});

const updateStatus = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body.data;
    const updated = await assetMaintenanceSolutionBankService.updateStatus(id, updateData);
    res.send({ code: 1, data: updated });
});

const getAllAssetMaintenanceSolutionBank = catchAsync(async (req, res) => {
    const assets = await assetMaintenanceSolutionBankService.getAllAssetMaintenanceSolutionBank();
    res.send({ code: 1, data: assets });
});

const getResById = catchAsync(async (req, res) => {
    const assets = await assetMaintenanceSolutionBankService.getResById(req.query.id);
    if (!assets) {
        throw new ApiError(httpStatus.NOT_FOUND, 'assetMaintenanceSolutionBankService not found');
    }
    res.send({ code: 1, data: assets });
});

const getDefectNotUsed = catchAsync(async (req, res) => {
    const defects = await assetMaintenanceSolutionBankService.getDefectNotUsed(req.query.id);
    res.send({ code: 1, data: defects });
});

module.exports = {
    createAssetMaintenanceSolutionBank,
    getAssetMaintenanceSolutionBankById,
    updateAssetMaintenanceSolutionBank,
    deleteAssetMaintenanceSolutionBank,
    updateStatus,
    getAllAssetMaintenanceSolutionBank,
    getResById,
    getDefectNotUsed,
};
