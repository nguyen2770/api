const express = require('express');
const { requestIssueController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/create', auth('createRequestIssue'), requestIssueController.createRequestIssue);
router.get('/get-list', requestIssueController.getRequestIssues);
router.get('/get-by-id', requestIssueController.getRequestIssueById);
router.patch('/update', auth("updateRequestIssue"), requestIssueController.updateRequestIssue);
router.delete('/delete', auth("deleteRequestIssue"), requestIssueController.deleteRequestIssue);
router.get('/get-all', requestIssueController.getAllRequestIssues);
router.get('/get-detail-by-id', requestIssueController.getRequestIssueDetailById);
router.patch('/update-action', auth("updateAction"), requestIssueController.updateAction)

module.exports = router;
