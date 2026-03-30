const express = require('express');
const { calibrationWorkController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/create', auth('createCalibrationWork'), calibrationWorkController.createCalibrationWork);
router.patch('/get-list', auth('getCalibrationWorks'), calibrationWorkController.getCalibrationWorks);
router.patch('/delete/:id', auth('deleteCalibrationWorkById'), calibrationWorkController.deleteCalibrationWorkById);
router.patch(
    '/comfirm-cancel/:id',
    auth('comfirmCancelCalibrationWorkById'),
    calibrationWorkController.comfirmCancelCalibrationWorkById
);
router.patch('/assign-user', auth('assignUser'), calibrationWorkController.assignUser);
router.patch(
    '/reassignment-calibration-work',
    auth('reassignmentCalibrationWorkAssignUser'),
    calibrationWorkController.reassignmentCalibrationWorkAssignUser
);
router.get('/get-by-id/:id', auth('getCalibrationWorkById'), calibrationWorkController.getCalibrationWorkById);
router.patch(
    '/get-list-my-calibration-work',
    auth('getMyCalibrationWorks'),
    calibrationWorkController.getMyCalibrationWorks
);
router.patch(
    '/comfirm-reject',
    auth('comfirmRejectCalibrationWork'),
    calibrationWorkController.comfirmRejectCalibrationWork
);
router.patch(
    '/comfirm-accept',
    auth('comfirmAcceptCalibrationWork'),
    calibrationWorkController.comfirmAcceptCalibrationWork
);
router.get(
    '/get-by-id-assign-user/:id',
    auth('getCalibrationWorkAssignUserById'),
    calibrationWorkController.getCalibrationWorkAssignUserById
);
router.patch('/calibrated-comfirm', auth('calibratedComfirm'), calibrationWorkController.calibratedComfirm);
router.patch('/update-calibrated-comfirm', auth('updateCalibratedComfirm'), calibrationWorkController.updateCalibratedComfirm);
router.patch(
    '/comfirm-close-calibration-work',
    auth('comfirmCloseCalibrationWork'),
    calibrationWorkController.comfirmCloseCalibrationWork
);
router.patch(
    '/comfirm-reopen-calibration-work',
    auth('comfirmReOpenCalibrationWork'),
    calibrationWorkController.comfirmReOpenCalibrationWork
);
router.get(
    '/get-all-calibration-work-history/:id',
    auth('getAllCalibrationWorkHistorys'),
    calibrationWorkController.getAllCalibrationWorkHistorys
);
router.get(
    '/get-current-calibration-work-checkin-checkout',
    auth('getCurrentCalibrationWorkCheckinCheckout'),
    calibrationWorkController.getCurrentCalibrationWorkCheckinCheckout
);
router.post('/check-in-calibration-work', auth('checkinCalibrationWork'), calibrationWorkController.checkinCalibrationWork);
router.post(
    '/check-out-calibration-work',
    auth('checkOutCalibrationWork'),
    calibrationWorkController.checkOutCalibrationWork
);
router.post(
    '/create-calibration-work-comment',
    auth('createCalibrationWorkComment'),
    calibrationWorkController.createCalibrationWorkComment
);
router.patch(
    '/get-calibration-work-comment',
    auth('getCalibrationWorkComments'),
    calibrationWorkController.getCalibrationWorkComments
);
router.patch(
    '/get-group-calibration-work',
    auth('queryGroupCalibrationWorks'),
    calibrationWorkController.queryGroupCalibrationWorks
);
router.patch(
    '/get-total-calibration-work-by-group-status',
    auth('getTotalCalibrationWorkByGroupStatus'),
    calibrationWorkController.getTotalCalibrationWorkByGroupStatus
);
router.get(
    '/get-total-calibration-work-assign-user-by-status',
    auth('getTotalCalibrationWorkAssignUserByStatus'),
    calibrationWorkController.getTotalCalibrationWorkAssignUserByStatus
);
router.patch(
    '/get-calibration-work-history',
    auth('getAssetCalibrationWorkHistorys'),
    calibrationWorkController.getAssetCalibrationWorkHistorys
);
router.get(
    '/get-calibration-work-history',
    auth('getCalibrationWorkHistory'),
    calibrationWorkController.getCalibrationWorkHistory
);
router.get(
    '/get-down-time-by-calibration-work-assign-user/:id',
    auth('getDownTimeByCalibrationWorkAssignUser'),
    calibrationWorkController.getDownTimeByCalibrationWorkAssignUser
);
module.exports = router;
