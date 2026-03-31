const express = require('express');
const { requestPurchaseController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/create', auth('createRequestPurchase'), requestPurchaseController.createRequestPurchase);
router.get('/get-list', requestPurchaseController.getRequestPurchases);
router.get('/get-by-id', requestPurchaseController.getRequestPurchaseById);
router.patch('/update', auth('updateRequestPurchase'), requestPurchaseController.updateRequestPurchase);
router.patch('/update-status', auth('updateStatus'), requestPurchaseController.updateStatus);
router.delete('/delete', auth('deleteRequestPurchase'), requestPurchaseController.deleteRequestPurchase);
router.get('/get-all', requestPurchaseController.getAllRequestPurchase);
router.get('/get-detail-by-id', requestPurchaseController.getRequestPurchasesDetailById)

module.exports = router;