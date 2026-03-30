const express = require('express');
const { assetMaintenanceDefectController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/create', auth('createAssetMaintenanceDefect'), assetMaintenanceDefectController.createAssetMaintenanceDefect);
router.get('/get-by-id', assetMaintenanceDefectController.getAssetMaintenanceDefectById);
router.patch('/update', auth('updateAssetMaintenanceDefect'), assetMaintenanceDefectController.updateAssetMaintenanceDefect);
router.patch('/update-status', auth('updateStatus'), assetMaintenanceDefectController.updateStatus);
router.delete('/delete', auth('deleteAssetMaintenanceDefect'), assetMaintenanceDefectController.deleteAssetMaintenanceDefect);
router.get('/get-all', assetMaintenanceDefectController.getAllAssetMaintenanceDefect);
router.get('/get-res-by-id', assetMaintenanceDefectController.getResById);
module.exports = router;
