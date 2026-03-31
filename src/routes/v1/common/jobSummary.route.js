const express = require('express');
const { jobSummaryController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.patch('/get-job-summary', auth('getJobSummary'), jobSummaryController.getJobSummary);
module.exports = router;
