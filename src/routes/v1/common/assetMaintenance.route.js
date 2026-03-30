const express = require('express');
const { assetMaintenanceController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/create', auth('createAssetMaintenance'), assetMaintenanceController.createAssetMaintenance);
router.patch('/get-list', auth('getAssetMaintenances'), assetMaintenanceController.getAssetMaintenances);
router.get('/get-by-id', assetMaintenanceController.getAssetMaintenanceById);
router.patch('/update', auth('updateAssetMaintenance'), assetMaintenanceController.updateAssetMaintenance);
router.get('/get', assetMaintenanceController.getAssetMaintenance);
router.patch('/update-status', auth('updateStatus'), assetMaintenanceController.updateStatus);
router.delete('/delete', auth('deleteAssetMaintenance'), assetMaintenanceController.deleteAssetMaintenance);
router.delete('/delete-list', auth('deleteManyAssetMaintenance'), assetMaintenanceController.deleteManyAssetMaintenance);
router.get('/get-all', assetMaintenanceController.getAllAssetMaintenance);
router.get('/get-all-sub', assetMaintenanceController.getAllSub);
router.get('/get-asset-model-by-res', assetMaintenanceController.getAssetModelRes);
router.get('/get-all-asset-model', assetMaintenanceController.getAllAssetModel);
router.get('/get-asset-maintenance-res', assetMaintenanceController.getAssetMaintenanceRes);
router.post(
    '/create-location-history',
    auth('createAssetMaintenanceLocationHistory'),
    assetMaintenanceController.createAssetMaintenanceLocationHistory
);
router.get('/get-location-history-by-res', assetMaintenanceController.getAssetMaintenanceLocationHistoryByRes);
router.get('/get-all-downtime/:id', assetMaintenanceController.getAllDownTimeAssetMaintenance);
router.patch('/get-asset-summary', auth('getAssetSummary'), assetMaintenanceController.getAssetSummary);
router.get(
    '/get-asset-maintenance-due-inspections',
    auth('getAssetMaintenanceDueInspections'),
    assetMaintenanceController.getAssetMaintenanceDueInspections
);
router.get('/update-data', assetMaintenanceController.updateData);
router.patch('/get-list-mobile', auth('getAssetMaintenanceMobile'), assetMaintenanceController.getAssetMaintenanceMobile);
router.get('/get-current-asset-number', auth('getCurrentAssetNumber'), assetMaintenanceController.getCurrentAssetNumber);
router.patch(
    '/get-asset-maintenance-checklist-by-res',
    auth('getAssetMaintenanceChecklistByRes'),
    assetMaintenanceController.getAssetMaintenanceChecklistByRes
);
router.patch(
    '/update-asset-maintenance-checklist-by-asset-maintenance',
    auth('updateAssetMaintenanceChecklistByAssetMaintenance'),
    assetMaintenanceController.updateAssetMaintenanceChecklistByAssetMaintenance
);
router.patch(
    '/get-asset-maintenance-checklist-by-res-not-auth',
    assetMaintenanceController.getAssetMaintenanceChecklistByRes
);
router.patch('/update-cancel-asset', auth('requestCancelAsset'), assetMaintenanceController.requestCancelAsset);
router.patch('/approve-cancel-asset', auth('approveCancelAsset'), assetMaintenanceController.approveCancelAsset);
router.patch(
    '/get-property-accessories-by-asset-maintenance',
    // auth('getPropertyAccessoriesByAssetMaintenance'),
    assetMaintenanceController.getPropertyAccessoriesByAssetMaintenance
);
router.patch(
    '/map-property-accessories-with-asset-maintenance',
    auth('mapPropertyAccessoriesWithAssetMaintenance'),
    assetMaintenanceController.mapPropertyAccessoriesWithAssetMaintenance
);
router.patch(
    '/get-property-accessories-not-map',
    auth('getPropertyAccessoriesNotMap'),
    assetMaintenanceController.getPropertyAccessoriesNotMap
);
router.delete(
    '/delete-parentId-in-property-pccessories',
    auth('deleteParentIdInPropertyAccessories'),
    assetMaintenanceController.deleteParentIdInPropertyAccessories
);
router.patch(
    '/update-asset-status',
    assetMaintenanceController.updateAssetStatus
);
router.patch('/update-return-asset', auth('requestCancelAsset'), assetMaintenanceController.requestReturnAsset);
router.patch('/approve-return-asset', auth('approveCancelAsset'), assetMaintenanceController.approveReturnAsset);

router.patch('/disposal-asset', auth('approveCancelAsset'), assetMaintenanceController.disposalAsset);
module.exports = router;
