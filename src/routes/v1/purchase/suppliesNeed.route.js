const express = require('express');
const { suppliesNeedController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/create', auth('createSuppliesNeed'), suppliesNeedController.createSuppliesNeed);
router.get('/get-list', suppliesNeedController.getSuppliesNeeds);
router.get('/get-by-id', suppliesNeedController.getSuppliesNeedById);
router.patch('/update', auth('updateSuppliesNeed'), suppliesNeedController.updateSuppliesNeed);
router.patch('/update-action', auth('updateAction'), suppliesNeedController.updateAction);
router.delete('/delete', auth('deleteSuppliesNeed'), suppliesNeedController.deleteSuppliesNeed);
router.get('/get-all', suppliesNeedController.getAllSuppliesNeed);
router.get('/get-detail-by-id', suppliesNeedController.getSuppliesNeedDetailById)

module.exports = router;