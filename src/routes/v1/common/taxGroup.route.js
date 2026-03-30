const express = require('express');
const { taxGroupController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/create', auth('createTaxGroup'), taxGroupController.createTaxGroup);
router.get('/list', taxGroupController.getTaxGroups);
router.get('/get-by-id', taxGroupController.getTaxGroupById);
router.patch('/update', auth('updateTaxGroup'), taxGroupController.updateTaxGroup);
router.delete('/delete', auth('deleteTaxGroup'), taxGroupController.deleteTaxGroup);
router.get('/get-all', taxGroupController.getAllTaxGroups);
module.exports = router;
