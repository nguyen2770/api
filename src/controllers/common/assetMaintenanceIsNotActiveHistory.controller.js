const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const { assetMaintenanceIsNotActiveHistoryService } = require('../../services');
const ApiError = require('../../utils/ApiError');

const getAssetMaintenanceIsNotActiveHistoryByAssetMaintenance = catchAsync(async (req, res) => {
    const assets = await assetMaintenanceIsNotActiveHistoryService.assetMaintenanceIsNotActiveHistoryByAssetMaintenance(
        req.query.assetMaintenance
    );
    res.send({ code: 1, data: assets });
});
const updateAssetMaintenanceIsNotActiveHistoryById = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body.data;
    const update = await assetMaintenanceIsNotActiveHistoryService.updateAssetMaintenanceIsNotActiveHistoryById(
        req.body.id,
        updateData
    );
    res.send({ code: 1, data: update });
});
module.exports = {
    getAssetMaintenanceIsNotActiveHistoryByAssetMaintenance,
    updateAssetMaintenanceIsNotActiveHistoryById,
};
