const express = require('express');
const { purchaseQuotationController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/create', auth('createPurchaseQuotation'), purchaseQuotationController.createPurchaseQuotation);
router.get('/get-list', purchaseQuotationController.getPurchaseQuotations);
router.get('/get-by-id', purchaseQuotationController.getPurchaseQuotationById);
router.patch('/update', auth('updatePurchaseQuotation'), purchaseQuotationController.updatePurchaseQuotation);
router.patch('/update-status', auth('updateStatus'), purchaseQuotationController.updateStatus);
router.delete('/delete', auth('deletePurchaseQuotation'), purchaseQuotationController.deletePurchaseQuotation);
router.get('/get-all', purchaseQuotationController.getAllPurchaseQuotations);
router.get('/get-detail-by-id', purchaseQuotationController.getPurchaseQuotationDetailByQuotationId);
router.get('/get-detail', purchaseQuotationController.getPurchaseQuotationDetail);
router.get('/get-info', purchaseQuotationController.getQuotationInfo);
router.get('/get-quotation', purchaseQuotationController.getPurchaseQuotation)
router.get('/get-attachment', purchaseQuotationController.getQuotationAttachmentByQuotation)

module.exports = router;
