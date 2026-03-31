const express = require('express');
const { assetMaintenanceScheduleController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/create', auth('createAssetMaintenanceSchedule'), assetMaintenanceScheduleController.createAssetMaintenanceSchedule);
router.get('/get-by-id', assetMaintenanceScheduleController.getAssetMaintenanceScheduleById);
router.patch('/update', auth('updateAssetMaintenanceSchedule'), assetMaintenanceScheduleController.updateAssetMaintenanceSchedule);
router.delete('/delete', auth('deleteAssetMaintenanceSchedule'), assetMaintenanceScheduleController.deleteAssetMaintenanceSchedule);
router.get('/get-all', assetMaintenanceScheduleController.getAllAssetMaintenanceSchedule);
router.get('/get-res-by-id', assetMaintenanceScheduleController.getResById);
module.exports = router;
