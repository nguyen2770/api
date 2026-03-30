const express = require('express');

const auth = require('../../../middlewares/auth');
const { reportSchedulePreventiveController } = require('../../../controllers');

const router = express.Router();

router.patch('/get-details-procecssing-sattus-schedule-preventive', auth('getDetailsProcecssingSattusSchedulePreventive'), reportSchedulePreventiveController.getDetailsProcecssingSattusSchedulePreventive);
router.patch('/get-sumary-procecssing-sattus-schedule-preventive', auth('getSumaryProcecssingSattusSchedulePreventive'), reportSchedulePreventiveController.getSumaryProcecssingSattusSchedulePreventive);
router.patch('/get-details-report-enginee-performancein-schedulePreventive', auth('getDetailsReportEngineerPerformanceInSchedulePreventive'), reportSchedulePreventiveController.getDetailsReportEngineerPerformanceInSchedulePreventive);
router.patch('/get-summary-report-enginee-performancein-schedulePreventive', auth('getSummaryReportEngineerPerformanceInSchedulePreventive'), reportSchedulePreventiveController.getSummaryReportEngineerPerformanceInSchedulePreventive);
module.exports = router;

