const express = require('express');
const { assetMaintenanceAdditionalInfoController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/create', auth('createAssetMaintenanceAdditionalInfo'), assetMaintenanceAdditionalInfoController.createAssetMaintenanceAdditionalInfo);
router.get('/get-by-id', assetMaintenanceAdditionalInfoController.getAssetMaintenanceAdditionalInfoById);
router.patch('/update', auth('updateAssetMaintenanceAdditionalInfo'), assetMaintenanceAdditionalInfoController.updateAssetMaintenanceAdditionalInfo);
router.patch('/update-status', auth('updateStatus'), assetMaintenanceAdditionalInfoController.updateStatus);
router.delete('/delete', auth('deleteAssetMaintenanceAdditionalInfo'), assetMaintenanceAdditionalInfoController.deleteAssetMaintenanceAdditionalInfo);
router.get('/get-all', assetMaintenanceAdditionalInfoController.getAllAssetMaintenanceAdditionalInfo);
router.get('/get-res-by-id', assetMaintenanceAdditionalInfoController.getResById);
module.exports = router;
