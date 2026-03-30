const express = require('express');
const { assetMaintenanceIsNotActiveHistoryController } = require('../../../controllers');

const router = express.Router();

router.get('/get-by-asset-maintenance', assetMaintenanceIsNotActiveHistoryController.getAssetMaintenanceIsNotActiveHistoryByAssetMaintenance);

module.exports = router;
