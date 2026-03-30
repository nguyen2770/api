const express = require('express');
const reportController = require('../../../controllers/report/report.controller');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.patch('/get-breakdown-chart', auth('getBreakdownChart'), reportController.getBreakdownChart);
router.patch(
    '/get-schedule-preventive-chart',
    auth('getSchedulePreventiveChart'),
    reportController.getSchedulePreventiveChart
);
router.patch('/get-approve-work', auth('getApproveWorks'), reportController.getApproveWorks);
router.patch(
    '/get-schedule-preventive-compliance',
    auth('getSchedulePreventiveCompliance'),
    reportController.getSchedulePreventiveCompliance
);
router.patch('/get-breakdown-compliance', auth('getBreakdownCompliance'), reportController.getBreakdownCompliance);
router.patch('/get-upTime-assetMaintenance', auth('getUpTimeAssetMaintenance'), reportController.getUpTimeAssetMaintenance);
router.patch(
    '/get-schedule-preventive-vs-assignUser',
    auth('getSchedulePreventiveVsAssignUser'),
    reportController.getSchedulePreventiveVsAssignUser
);
router.patch(
    '/get-average-response-time',
    auth('getAverageResponseTimeBreakdown'),
    reportController.getAverageResponseTimeBreakdown
);
router.patch(
    '/get-average-resolution-time',
    auth('getAverageResolutionTimeBreakdown'),
    reportController.getAverageResolutionTimeBreakdown
);
router.patch(
    '/compare-status-schedule-preventive-and-breakdown-by-customer',
    auth('compareStatusSchedulePreventiveAndBreakdownByCustomer'),
    reportController.compareStatusSchedulePreventiveAndBreakdownByCustomer
);
router.patch('/get-data-kpb-indicators', auth('getDataKPBIndicators'), reportController.getDataKPBIndicators);
router.patch('/total-operational-metrics', auth('totalOperationalMetrics'), reportController.totalOperationalMetrics);
router.patch('/get-spare-movement', auth('spareMovementReport'), reportController.spareMovementReport);
router.patch('/get-spare-usage-summary', auth('sparePartsUsageSummaryReport'), reportController.sparePartsUsageSummaryReport);
router.patch('/get-assetMaintenance-report', auth('getAssetMaintenanceReport'), reportController.getAssetMaintenanceReport);
router.get('/get-my-task-calender', auth('getMyTaskCalender'), reportController.getMyTaskCalender);
router.get('/get-my-ticket-calender', auth('getMyTicketCalender'), reportController.getMyTicketCalender);
router.get('/get-my-calibration-calender', auth('getMyCalibrationCalender'), reportController.getMyCalibrationCalender);
router.patch(
    '/update-approval-task-status-processed',
    auth('updateApprovalTaskStatusProcessed'),
    reportController.updateApprovalTaskStatusProcessed
);
router.patch(
    '/get-calibration-work-chart',
    auth('getCalibrationWorkChart'),
    reportController.getCalibrationWorkChart
);
router.patch(
    '/get-calibration-work-compliance',
    auth('getCalibrationWorkCompliance'),
    reportController.getCalibrationWorkCompliance
);
module.exports = router;
