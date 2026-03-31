const express = require('express');
const { customerSpareStockController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/create', auth('createCustomerSpareStock'), customerSpareStockController.createCustomerSpareStock);
router.get('/list', customerSpareStockController.getCustomerSpareStocks);
router.get('/get-by-id', customerSpareStockController.getCustomerSpareStockById);
router.patch('/update', auth('updateCustomerSpareStock'), customerSpareStockController.updateCustomerSpareStock);
router.delete('/delete', auth('deleteCustomerSpareStock'), customerSpareStockController.deleteCustomerSpareStock);
router.get('/get-all', customerSpareStockController.getAllCustomerSpareStocks);
router.get('/get-by-sparePartId', customerSpareStockController.getCustomerSpareStockBySparePartsId);

module.exports = router;