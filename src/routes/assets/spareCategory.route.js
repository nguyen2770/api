const express = require('express');
const { spareCategoryController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();
router.get('/get-list', spareCategoryController.getSpareCategories);
router.get('/get-all', spareCategoryController.getAllSpareCategories);
router.post('/create', auth("createSpareCategory"), spareCategoryController.createSpareCategory);
router.patch('/update-status/:id', auth("updateStatus"), spareCategoryController.updateStatus);
router.patch('/update/:id', auth("updateSpareCategory"), spareCategoryController.updateSpareCategory);
router.delete('/delete/:id', auth("deleteSpareCategory"), spareCategoryController.deleteSpareCategory);
module.exports = router;
