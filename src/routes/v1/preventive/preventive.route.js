const express = require('express');
const { preventiveController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/create', auth('createPreventive'), preventiveController.createPreventive);
router.patch('/get-list', auth('getPreventives'), preventiveController.getPreventives);
router.get('/get-by-id', preventiveController.getPreventiveById);
router.patch('/update', auth('updatePreventive'), preventiveController.updatePreventive);
router.patch('/update-status', auth('updateStatus'), preventiveController.updateStatus);
router.delete('/delete', auth('deletePreventive'), preventiveController.deletePreventive);
router.get('/get-all', preventiveController.getAllPreventive);
router.get('/get-re-assign-user-by-preventive', preventiveController.getResAssignUserByPreventive);
router.patch('/stop-preventive', auth('stopPreventive'), preventiveController.stopPreventive);
router.patch('/start-preventive', auth('startPreventive'), preventiveController.startPreventive);
router.patch('/comfirm-reassignuser', auth('comfirmReAssignUser'), preventiveController.comfirmReAssignUser);
router.post('/create-preventive-comment', auth('createPreventiveComment'), preventiveController.createPreventiveComment);
router.get('/get-preventive-comment', preventiveController.getPreventiveComments);
router.patch(
    '/get-preventive-by-condition-base-schedule',
    auth('getPreventiveByConditionBasedSchedule'),
    preventiveController.getPreventiveByConditionBasedSchedule
);
router.patch(
    '/generate-schedule-preventive-by-preventive-condition-based-schedule',
    auth('generateSchedulePrenventiveByPreventiveConditionBasedSchedule'),
    preventiveController.generateSchedulePrenventiveByPreventiveConditionBasedSchedule
);
router.patch(
    '/get-all-preventive-condition-based-schedule-history-by-preventive',
    auth('getAllPreventiveConditionBasedScheduleHistoryByPreventive'),
    preventiveController.getAllPreventiveConditionBasedScheduleHistoryByPreventive
);
router.patch('/change-of-contract', auth('changeOfContractPreventive'), preventiveController.changeOfContractPreventive);
module.exports = router;
