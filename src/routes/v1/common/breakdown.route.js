const express = require('express');
const { breakdownController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();
router.post('/create', auth('createBreakdown'), breakdownController.createBreakdown);
router.post('/get-list', auth('getBreakdowns'), breakdownController.getBreakdowns);
router.get('/get-all-breakdown-attachment', breakdownController.getAllBreakdownAttachment);
router.get('/get-breakdown-by-user', breakdownController.getBreakdownByUser);
router.get('/get-by-id', breakdownController.getBreakdownById);
router.patch('/update', auth('updateBreakdown'), breakdownController.updateBreakdown);
router.patch('/update-status', auth('updateStatus'), breakdownController.updateStatus);
router.delete('/delete', auth('deleteBreakdown'), breakdownController.deleteBreakdown);
router.get('/get-all', breakdownController.getAllBreakdown);
router.get('/get-all-search-my-breakdown', auth('getAllSearchMyBreakdown'), breakdownController.getAllSearchMyBreakdown);
router.get('/get-all-sub', breakdownController.getSubBreakdown);
router.post('/create-breakdown-comment', auth('createBreakdownComment'), breakdownController.createBreakdownComment);
router.get('/get-breakdown-comment', breakdownController.getBreakdownComments);
router.post('/comfirm-close-breakdown', auth('comfirmCloseBreakdown'), breakdownController.comfirmCloseBreakdown);
router.post('/comfirm-reopen-breakdown', auth('comfirmReopenBreakdown'), breakdownController.comfirmReopenBreakdown);
router.patch('/comfirm-cancel-breakdown', auth('comfirmCancelBreakdown'), breakdownController.comfirmCancelBreakdown);
router.post(
    '/create-breakdown-attachment',
    auth('createBreakdownAttachment'),
    breakdownController.createBreakdownAttachment
);
router.patch('/get-total-breakdown-status', auth('getTotalBreakdwonStatus'), breakdownController.getTotalBreakdwonStatus);
router.post('/create-breakdown-no-auth', breakdownController.createBreakdownNoAuth);
router.patch('/get-asset-incident-history', auth('getAssetIncidentHistorys'), breakdownController.getAssetIncidentHistorys);
router.get('/get-all-attachment-by-breakdown', breakdownController.getAllAttachmentByBreackdown);

module.exports = router;
