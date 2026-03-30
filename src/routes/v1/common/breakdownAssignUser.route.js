const express = require('express');
const { breakdownAssignUserController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/create', auth('createBreakdownAssignUser'), breakdownAssignUserController.createBreakdownAssignUser);
router.get('/get-by-breakdownId', breakdownAssignUserController.getBreakdownAssignUsersByBreakdownId);
router.get('/get-by-id', breakdownAssignUserController.getBreakdownAssignUserById);
router.get('/get-by-res', breakdownAssignUserController.getBreakdownAssignUserByRes);
router.get('/get-breakdown-assign-user', auth("getBreakdownAssignUserByBreakdownId"), breakdownAssignUserController.getBreakdownAssignUserByBreakdownId);
router.patch('/update-status', auth('updateBreakdownAssignUser'), breakdownAssignUserController.updateBreakdownAssignUser);
router.patch('/replecement-assign-user', auth('replecementBreakdownAssignUser'), breakdownAssignUserController.replacementAssignUser);
router.patch('/comfirm-accept-breakdown-assign-user', auth("comfirmAcceptBreakdownAssignUer"), breakdownAssignUserController.comfirmAcceptBreakdownAssignUer);
router.patch('/comfirm-refuse-breakdown-assign-user', auth("comfirmRefuseBreakdownAssignUer"), breakdownAssignUserController.comfirmRefuseBreakdownAssignUer);
router.patch('/check-in-breakdown/:breakdownAssignUserId', auth('checkInBreakdown'), breakdownAssignUserController.checkInBreakdown);
router.patch('/check-out-breakdown/:breakdownAssignUserId', auth('checkOutBreakdown'), breakdownAssignUserController.checkoutBreakdown);
router.patch('/request-for-support', auth('requestForSupport'), breakdownAssignUserController.requestForSupport);
router.patch('/comfirm-breakdown-fixed', auth('comfirmBreakdownFixed'), breakdownAssignUserController.comfirmBreakdownAssignUserFixed);
router.post('/create-breakdown-assign-user-repair', auth('createBreakdownAssignUserRepair'), breakdownAssignUserController.createBreakdownAssignUserRepair);
router.get('/get-by-breakdown-wca', breakdownAssignUserController.getBreakdowUserByBreakdownEndWCA);
router.patch('/comfirm-breakdown-fixed-mobile', auth('comfirmBreakdownAssignUserFixedMobile'), breakdownAssignUserController.comfirmBreakdownAssignUserFixedMobile);
router.get('/get-total-my-breakdown-assign-user', auth('getTotalMyBreakdownAssignUserStatus'), breakdownAssignUserController.getTotalMyBreakdownAssignUserStatus);
router.patch('/get-total-engineer-breakdown-assign/:breakdownUserAssignId', auth('getTotalEngineerBreakdownAssignUser'), breakdownAssignUserController.getTotalEngineerBreakdownAssignUser);
module.exports = router;
