const express = require('express');
const { assetTypeCategoryController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/create', auth('createAssetCategoryType'), assetTypeCategoryController.createAssetTypeCategory);
router.get('/get-list', assetTypeCategoryController.getAssetTypeCategorys);
router.get('/get-by-id', assetTypeCategoryController.getAssetTypeCategoryById);
router.patch('/update', auth('updateAssetCategoryType'), assetTypeCategoryController.updateAssetTypeCategory);
router.patch('/update-status', auth('updateStatuusAssetCategoryType'), assetTypeCategoryController.updateStatus);
router.delete('/delete', auth('deleteAssetTypeCategory'), assetTypeCategoryController.deleteAssetTypeCategory);
router.get('/get-all', assetTypeCategoryController.getAllAssetTypeCategory);
module.exports = router;
