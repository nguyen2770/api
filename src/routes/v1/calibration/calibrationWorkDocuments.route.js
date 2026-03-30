const express = require('express');
const { calibrationWorkDocumentsController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/create', auth('createCalibrationWorkDocument'), calibrationWorkDocumentsController.createCalibrationWorkDocument);
router.get('/get-calibration-work-documents-by-calibration-work-id', auth('getCalibrationWorkDocumentsByCalibrationWorkId'), calibrationWorkDocumentsController.getCalibrationWorkDocumentsByCalibrationWorkId);
router.delete('/delete/:id', auth('deleteCalibrationWorkDocument'), calibrationWorkDocumentsController.deleteCalibrationWorkDocument);
module.exports = router;
