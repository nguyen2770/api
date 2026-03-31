const express = require('express');
const { spareSubCategoryController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();
router.get('/get-list', spareSubCategoryController.getSpareSubCategories);
router.post('/create', auth("createSpareSubCategory"), spareSubCategoryController.createSpareSubCategory);
router.patch('/update-status/:id', auth("updateStatus"), spareSubCategoryController.updateStatus);
router.patch('/update/:id', auth("updateSpareSubCategory"), spareSubCategoryController.updateSpareSubCategory);
router.delete('/delete/:id', auth("deleteSpareSubCategory"), spareSubCategoryController.deleteSpareSubCategory);
router.get('/get-by-spare-category-id', spareSubCategoryController.getSubCategoryByCategoryId);

module.exports = router;
