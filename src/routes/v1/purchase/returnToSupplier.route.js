const express = require('express');
const { returnToSupplierController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/create', auth('createReturnToSupplier'), returnToSupplierController.createReturnToSupplier);
router.get('/get-list', returnToSupplierController.getReturnToSuppliers);
router.get('/get-by-id', returnToSupplierController.getReturnToSupplierById);
router.patch('/update', auth('updateReturnToSupplier'), returnToSupplierController.updateReturnToSupplier);
router.delete('/delete', auth('deleteReturnToSupplier'), returnToSupplierController.deleteReturnToSupplier);
router.get('/get-all', returnToSupplierController.getAllReturnToSuppliers);
router.get('/get-detail-by-id', returnToSupplierController.getReturnToSupplierDetailById);
router.get('/get-current-qty', returnToSupplierController.getCurrentQty)

module.exports = router;
