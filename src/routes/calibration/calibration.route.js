const express = require('express');
const { calibrationController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/create', auth('createCalibration'), calibrationController.createCalibration);
router.patch('/get-list', auth('getCalibrations'), calibrationController.getCalibrations);
router.delete('/delete', auth('getCalibrations'), calibrationController.deleteCalibrationById);
router.patch('/reassignment-user', auth('reassignmentUser'), calibrationController.reassignmentUser);
router.patch('/assign-user', auth('assignUser'), calibrationController.assignUser);
router.get('/get-by-id', auth('getCalibrationById'), calibrationController.getCalibrationById);
router.patch('/update', auth('updateCalibrationById'), calibrationController.updateCalibrationById);
router.patch('/start-calibration', auth('startCalibration'), calibrationController.startCalibration);
router.patch('/stop-calibration', auth('stopCalibration'), calibrationController.stopCalibration);
router.patch('/change-of-calibration-contract', auth('changeOfCalibrationContract'), calibrationController.changeOfCalibrationContract);
module.exports = router;
