const express = require('express');
const { assetModelMonitoringPointController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/create', auth('createAssetModelMonioringPoint'), assetModelMonitoringPointController.createAssetModelMonioringPoint);
router.get('/get-by-id', assetModelMonitoringPointController.getAssetModelMonioringPointById);
router.patch('/update', auth('updateAssetModelMonioringPoint'), assetModelMonitoringPointController.updateAssetModelMonioringPoint);
router.patch('/update-status', auth('updateStatus'), assetModelMonitoringPointController.updateStatus);
router.delete('/delete', auth('deleteAssetModelMonioringPoint'), assetModelMonitoringPointController.deleteAssetModelMonioringPoint);
router.get('/get-all', assetModelMonitoringPointController.getAllAssetModelMonitoringPoint);
router.get('/get-res-by-id', assetModelMonitoringPointController.getResById);
module.exports = router;
