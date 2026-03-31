const express = require('express');
const { assetIdInfoController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();
router.post('/create', auth('createAssetIdInfo'), assetIdInfoController.createAssetIdInfo);
router.get('/get-list-for-assetMaintenance', assetIdInfoController.getAssetInfoByAssetMaintenanceId);
router.get('/get-by-id', assetIdInfoController.getAssetIdInfoById);
router.patch('/update', auth('updateAssetIdInfo'), assetIdInfoController.updateAssetIdInfo);
router.patch('/update-status', auth('updateStatus'), assetIdInfoController.updateStatus);
router.delete('/delete', auth('deleteAssetIdInfo'), assetIdInfoController.deleteAssetIdInfo);
module.exports = router;
