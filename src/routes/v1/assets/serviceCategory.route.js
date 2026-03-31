const express = require('express');
const { serviceCategoryController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();
router.get('/get-list', serviceCategoryController.getServiceCategories);
router.get('/get-all', serviceCategoryController.getAllServiceCategory);
router.post('/create', auth("createServiceCategory"), serviceCategoryController.createServiceCategory);
router.patch('/update-status/:id', auth("updateStatus"), serviceCategoryController.updateStatus);
router.patch('/update/:id', auth("updateServiceCategory"), serviceCategoryController.updateServiceCategory);
router.delete('/delete/:id', auth("deleteServiceCategory"), serviceCategoryController.deleteServiceCategory);
module.exports = router;
