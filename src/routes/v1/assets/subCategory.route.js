const express = require('express');
const { subCategoryController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/create', auth('createSubCategory'), subCategoryController.createSubCategory);
router.get('/get-list', subCategoryController.getSubCategorys);
router.get('/get-by-id', subCategoryController.getSubCategoryById);
router.patch('/update', auth('updateSubCategory'), subCategoryController.updateSubCategory);
router.patch('/update-status', auth('updateStatus'), subCategoryController.updateStatus);
router.delete('/delete', auth('deleteSubCategory'), subCategoryController.deleteSubCategory);
router.get('/get-all', subCategoryController.getAllSubCategory);
router.get('/get-by-categoryId', subCategoryController.getSubCategoryByCategoryId);
module.exports = router;
