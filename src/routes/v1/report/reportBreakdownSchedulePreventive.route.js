const express = require('express');

const auth = require('../../../middlewares/auth');
const { reportBreakdownSchedulePreventiveController } = require('../../../controllers');

const router = express.Router();

router.patch('/get-report-assetMaintenance-request', auth('getReportAssetMaintenanceRequest'), reportBreakdownSchedulePreventiveController.getReportAssetMaintenanceRequest);
module.exports = router;

