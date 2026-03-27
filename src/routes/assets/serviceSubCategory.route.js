const express = require('express');
const { serviceSubCategoryController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();
router.get('/get-list', serviceSubCategoryController.getServiceSubCategories);
router.get('/get-all', serviceSubCategoryController.getAllServiceSubCategory);
router.get('/get-by-service-category', serviceSubCategoryController.getServicerSubCategoryByServiceCategory);
router.post('/create', auth("createServiceSubCategory"), serviceSubCategoryController.createServiceSubCategory);
router.patch('/update-status/:id', auth("updateStatus"), serviceSubCategoryController.updateStatus);
router.patch('/update/:id', auth("updateServiceSubCategory"), serviceSubCategoryController.updateServiceSubCategory);
router.delete('/delete/:id', auth("deleteServiceSubCategory"), serviceSubCategoryController.deleteServiceSubCategory);
module.exports = router;
