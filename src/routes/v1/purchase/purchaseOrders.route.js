const express = require('express');
const { purchaseOrdersController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/create', auth('createPurchaseOrders'), purchaseOrdersController.createPurchaseOrders);
router.get('/get-list', purchaseOrdersController.getPurchaseOrders);
router.get('/get-by-id', purchaseOrdersController.getPurchaseOrdersById);
router.patch('/update', auth('updatePurchaseOrders'), purchaseOrdersController.updatePurchaseOrders);
router.patch('/update-status', auth('updateStatus'), purchaseOrdersController.updateStatus);
router.delete('/delete', auth('deletePurchaseOrders'), purchaseOrdersController.deletePurchaseOrders);
router.get('/get-all', purchaseOrdersController.getAllPurchaseOrders);
router.get('/get-detail-by-id', purchaseOrdersController.getPurchaseOrdersDetailById);
router.get('/get-detail', purchaseOrdersController.getPurchaseOrdersDetail);



module.exports = router;