const express = require('express');
const { suppliesNeedSparePartController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/create', auth('createSuppliesNeedSparePart'), suppliesNeedSparePartController.createSuppliesNeedSparePart);
router.get('/get-list', suppliesNeedSparePartController.getSuppliesNeedSpareParts);
router.get('/get-by-id', suppliesNeedSparePartController.getSuppliesNeedSparePartById);
router.patch('/update', auth('updateSuppliesNeedSparePart'), suppliesNeedSparePartController.updateSuppliesNeedSparePart);
router.patch('/update-status', auth('updateStatus'), suppliesNeedSparePartController.updateStatus);
router.delete('/delete', auth('deleteSuppliesNeedSparePart'), suppliesNeedSparePartController.deleteSuppliesNeedSparePart);
router.get('/get-all', suppliesNeedSparePartController.getAllSuppliesNeedSparePart);
router.get('/get-by-supplies-need', suppliesNeedSparePartController.getSuppliesNeedSparePartBySuppliesNeed)

module.exports = router;