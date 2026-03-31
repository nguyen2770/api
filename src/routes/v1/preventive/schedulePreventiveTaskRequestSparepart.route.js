const express = require('express');
const { schedulePrevetiveSparePartRequestController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post(
    '/create',
    auth('createSchedulePreventiveSparePartRequest'),
    schedulePrevetiveSparePartRequestController.createSchedulePreventiveSparePartRequest
);
router.patch(
    '/get-list',
    auth('querySchedulePrevetiveTaskSparePartRequests'),
    schedulePrevetiveSparePartRequestController.querySchedulePrevetiveTaskSparePartRequests
);
router.patch(
    '/comfirm-send-spare-part',
    auth('comfirmSendSparePart'),
    schedulePrevetiveSparePartRequestController.comfirmSendSparePart
);
router.patch(
    '/get-schedule-preventive-request-spare-part-by-id',
    auth('getScheduleePreventiveRequestSparePartById'),
    schedulePrevetiveSparePartRequestController.getScheduleePreventiveRequestSparePartById
);
module.exports = router;
