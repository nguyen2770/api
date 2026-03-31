const express = require('express');
const { stockReceiptController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/create', auth('createReceiptPurchase'), stockReceiptController.createStockReceipt);
router.get('/get-list', stockReceiptController.getStockReceipts);
router.get('/get-by-id', stockReceiptController.getStockReceiptById);
router.patch('/update', auth('updateReceiptPurchase'), stockReceiptController.updateStockReceipt);
router.delete('/delete', auth('deleteStockReceipt'), stockReceiptController.deleteStockReceipt);
router.get('/get-all', stockReceiptController.getAllStockReceipts);
router.get('/get-detail-by-id', stockReceiptController.getStockReceiptDetailById);
router.post('/approve', auth('approve'), stockReceiptController.approve);

module.exports = router;
