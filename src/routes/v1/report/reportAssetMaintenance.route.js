const express = require('express');

const auth = require('../../../middlewares/auth');
const { reportAssetMaintenanceController } = require('../../../controllers');

const router = express.Router();
router.patch('/get-summary-report-asset-performance', auth('getSummaryReportAssetPerformance'), reportAssetMaintenanceController.getSummaryReportAssetPerformance);
router.patch('/get-details-report-asset-performance', auth('getDetailsReportAssetPerformance'), reportAssetMaintenanceController.getDetailsReportAssetPerformance);

module.exports = router;

