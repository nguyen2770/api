const express = require('express');
const { preventiveMonitoringController} = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.patch('/get-list', auth('getPreventiveMonitorings'), preventiveMonitoringController.getPreventiveMonitorings);
router.patch('/update-preventive-monitoring/:id', auth('updatePreventiveMonitoringById'), preventiveMonitoringController.updatePreventiveMonitoringById);
router.patch('/get-list-preventive-monitoring', auth('getPreventiveMonitoringHistorys'), preventiveMonitoringController.getPreventiveMonitoringHistorys);
module.exports = router;
