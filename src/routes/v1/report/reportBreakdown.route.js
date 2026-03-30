const express = require('express');

const auth = require('../../../middlewares/auth');
const { reportBreakdownController } = require('../../../controllers');

const router = express.Router();

router.patch('/get-activity-report-breakdown', auth('getActivityReportBreakdown'), reportBreakdownController.getActivityReportBreakdown);
router.patch('/get-details-report-engineer-performance-in-breakdown', auth('getDetailsReportEngineerPerformanceInBreakdown'), reportBreakdownController.getDetailsReportEngineerPerformanceInBreakdown);
router.patch('/get-summary-report-engineer-performance-in-breakdown', auth('getSummaryReportEngineerPerformanceInBreakdown'), reportBreakdownController.getSummaryReportEngineerPerformanceInBreakdown);
module.exports = router;

