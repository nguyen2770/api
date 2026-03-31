const express = require('express');
const { assetMaintenanceCostReportController } = require('../../../controllers');

const router = express.Router();

router.get('/get-report', assetMaintenanceCostReportController.getReport);

module.exports = router;