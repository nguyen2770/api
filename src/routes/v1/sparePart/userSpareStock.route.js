const express = require('express');
const { userSpareStockController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/create', auth('createUserSpareStock'), userSpareStockController.createUserSpareStock);
router.get('/list', userSpareStockController.getUserSpareStocks);
router.get('/get-by-id', userSpareStockController.getUserSpareStockById);
router.patch('/update', auth('updateUserSpareStock'), userSpareStockController.updateUserSpareStock);
router.delete('/delete', auth('deleteUserSpareStock'), userSpareStockController.deleteUserSpareStock);
router.get('/get-all', userSpareStockController.getAllUserSpareStocks);
router.get('/get-by-sparePartId', userSpareStockController.getUserSpareStockBySparePartsId);

module.exports = router;