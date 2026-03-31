const express = require('express');
const { assetMaintenanceDocumentController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/create', auth('createAssetMaintenanceDocument'), assetMaintenanceDocumentController.createAssetMaintenanceDocument);
router.get('/get-by-id', assetMaintenanceDocumentController.getAssetMaintenanceDocumentById);
router.patch('/update', auth('updateAssetMaintenanceDocument'), assetMaintenanceDocumentController.updateAssetMaintenanceDocument);
router.patch('/update-status', auth('updateStatus'), assetMaintenanceDocumentController.updateStatus);
router.delete('/delete', auth('deleteAssetMaintenanceDocument'), assetMaintenanceDocumentController.deleteAssetMaintenanceDocument);
router.get('/get-all', assetMaintenanceDocumentController.getAllAssetMaintenanceDocument);
router.get('/get-res-by-id', assetMaintenanceDocumentController.getResById);
module.exports = router;
