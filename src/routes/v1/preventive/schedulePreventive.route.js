const express = require('express');
const { schedulePreventiveController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/create', auth('createSchedulePreventive'), schedulePreventiveController.createSchedulePreventive);
router.patch('/get-list', auth('getSchedulePreventivees'), schedulePreventiveController.getSchedulePreventivees);
router.patch(
    '/get-list-my-schedule-preventive',
    auth('getMySchedulePreventivees'),
    schedulePreventiveController.getMySchedulePreventivees
);
router.get('/get-by-id', auth('getSchedulePreventiveById'), schedulePreventiveController.getSchedulePreventiveById);
router.patch(
    '/user-confirm',
    auth('confirmSchedulePreventiveUser'),
    schedulePreventiveController.confirmSchedulePreventiveUser
);
router.patch(
    '/user-cancel-confirm',
    auth('cancelConfirmSchedulePreventiveUser'),
    schedulePreventiveController.cancelConfirmSchedulePreventiveUser
);
router.patch(
    '/update-checkin-checkout',
    auth('schedulePreventiveCheckInOut'),
    schedulePreventiveController.schedulePreventiveCheckInOut
);
router.patch('/update', auth('updateSchedulePreventive'), schedulePreventiveController.updateSchedulePreventive);
router.delete('/delete', auth('deleteSchedulePreventive'), schedulePreventiveController.deleteSchedulePreventive);
router.patch(
    '/schedule-preventive-task-assign-user',
    auth('schedulePreventiveTaskAssignUser'),
    schedulePreventiveController.schedulePreventiveTaskAssignUser
);
router.get(
    '/get-schedule-preventive-task-assign-user-by-id',
    schedulePreventiveController.getSchedulePreventiveTaskAssignUserById
);
router.patch(
    '/comfirm-cancel',
    auth('comfirmCancelSchedulePreventive'),
    schedulePreventiveController.comfirmCancelSchedulePreventive
);
router.patch(
    '/comfirm-close',
    auth('comfirmCloseSchedulePreventive'),
    schedulePreventiveController.comfirmCloseSchedulePreventive
);
router.patch(
    '/comfirm-reopen',
    auth('comfirmReOpenSchedulePreventive'),
    schedulePreventiveController.comfirmReOpenSchedulePreventive
);
router.get(
    '/get-current-checkin-checkout',
    auth('getCurrentCheckinCheckout'),
    schedulePreventiveController.getCurrentCheckinCheckout
);
router.post(
    '/check-in-schedule-preventive-task',
    auth('checkinSchedulePreventiveTask'),
    schedulePreventiveController.checkinSchedulePreventiveTask
);
router.post(
    '/check-out-schedule-preventive-task',
    auth('checkOutSchedulePreventiveTask'),
    schedulePreventiveController.checkOutSchedulePreventiveTask
);
router.post(
    '/start-work-task',
    auth('startWorkschedulePreventiveTask'),
    schedulePreventiveController.startWorkschedulePreventiveTask
);
router.patch(
    '/get-total-schedule-preventive',
    auth('getTotalSchedulePreventiveStatus'),
    schedulePreventiveController.getTotalSchedulePreventiveStatus
);
router.get(
    '/get-total-my-schedule-preventive',
    auth('getTotalMySchedulePreventiveStatus'),
    schedulePreventiveController.getTotalMySchedulePreventiveStatus
);
router.post(
    '/create-schedule-preventive-comment',
    auth('createSchedulePreventiveComment'),
    schedulePreventiveController.createSchedulePreventiveComment
);
router.get(
    '/get-schedule-preventive-comment',
    auth('getSchedulePreventiveComments'),
    schedulePreventiveController.getSchedulePreventiveComments
);
router.get(
    '/get-group-schedule-preventive',
    auth('getGroupSchedulePreventives'),
    schedulePreventiveController.getGroupSchedulePreventives
);
router.patch('/get-asset-schedule-preventive-history', auth('getAssetSchedulePreventivetHistorys'), schedulePreventiveController.getAssetSchedulePreventivetHistorys);
router.get(
    '/get-downtime-by-shedule-preventive-assign-user/:id',
    auth('getDowntimeByShedulePreventiveAssignUser'),
    schedulePreventiveController.getDowntimeByShedulePreventiveAssignUser
);
module.exports = router;
