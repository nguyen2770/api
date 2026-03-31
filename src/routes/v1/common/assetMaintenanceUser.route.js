const express = require('express');
const { assetMaintenanceUserController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/create', auth('createAssetMaintenanceUser'), assetMaintenanceUserController.createAssetMaintenanceUser);
router.get('/get-by-id', assetMaintenanceUserController.getAssetMaintenanceUserById);
router.delete('/delete', auth('deleteAssetMaintenanceUser'), assetMaintenanceUserController.deleteAssetMaintenanceUser);
router.get('/get-by-user', assetMaintenanceUserController.getAssetMaintenancesByUserId);
router.get('/get-by-asset-id', assetMaintenanceUserController.getUsersByAssetMaintenanceId);
router.get('/get-assetMaintenance-by-user', assetMaintenanceUserController.getUnassignedAssetMaintenancesByUserId);


module.exports = router;
