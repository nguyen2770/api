const express = require('express');

const auth = require('../../../middlewares/auth');
const { workReportByPersonController } = require('../../../controllers');

const router = express.Router();

router.patch('/get-report', auth('getWorkReportByPerson'), workReportByPersonController.getWorkReportByPerson);
router.get('/get-document', auth('getResource'), workReportByPersonController.getResource);
router.post('/get-list-work', auth('getListWorkReportByPerson'), workReportByPersonController.getListWorkReportByPerson);
router.post('/download-zip', auth('getFileZip'), workReportByPersonController.getFileZip);

module.exports = router;