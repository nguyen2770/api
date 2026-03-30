const express = require('express');
const { breakdownSpareRequestController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/create', auth("createBreakdownSpareRequests"), breakdownSpareRequestController.createBreakdownSpareRequests);
router.patch('/get-list', auth("queryBreakdownSpareRequests"), breakdownSpareRequestController.queryBreakdownSpareRequests);
router.get('/get-by-id', breakdownSpareRequestController.findBreakdownSpareRequestById);
router.patch('/update/:id', auth('updateBreakdownSpareRequestDetail'), breakdownSpareRequestController.updateBreakdownSpareRequestDetail);
router.patch('/update', auth('updateBreakdownSpareRequest'), breakdownSpareRequestController.updateBreakdownSpareRequest);
router.delete('/delete', auth('deleteBreakdownSpareRequest'), breakdownSpareRequestController.deleteBreakdownSpareRequest);
router.get('/getAll', breakdownSpareRequestController.queryBreakdownSpareRequestByBreakdown);
router.get('/get-by-spare-request', breakdownSpareRequestController.getAllBreakdownSpareRequestBySpareRequestId);
router.patch('/update', auth('updateData'), breakdownSpareRequestController.updateData);
router.patch('/assign-user-from-spare-request', auth("assignUserFromSpareRequest"), breakdownSpareRequestController.assignUserFromSpareRequest);
router.get('/get-by-res', breakdownSpareRequestController.getBreakdownSparePartResByRes);
router.patch('/approved/:breakdownSpareRequestId', auth('approve'), breakdownSpareRequestController.approveBreakdownSpareRequest);
module.exports = router;
