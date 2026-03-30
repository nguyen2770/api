const express = require('express');
const { stockIssueController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/create', auth('createReceiptIssue'), stockIssueController.createStockIssue);
router.get('/get-list', stockIssueController.queryStockIssue);
router.get('/get-by-id', stockIssueController.getStockIssueById);
router.patch('/update', auth('updateReceiptIssue'), stockIssueController.updateStockIssueById);
router.delete('/delete', auth('deleteStockIssueById'), stockIssueController.deleteStockIssueById);
router.get('/get-all', stockIssueController.getAllReceiptIssue);
router.get('/get-detail-by-id', stockIssueController.getReceiptStockIssueDetailById);
router.post('/approve', auth('approve'), stockIssueController.approve)

module.exports = router;
