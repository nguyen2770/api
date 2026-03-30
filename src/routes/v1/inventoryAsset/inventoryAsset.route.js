const express = require('express');
const inventoryAssetController = require('../../../controllers/inventoryAsset/inventoryAsset.controller');
const auth = require('../../../middlewares/auth');
const router = express.Router();

router.post('/create', auth("createInventoryAsset"), inventoryAssetController.createInventoryAsset);
router.post('/confirm', auth("confirmInventoryAsset"), inventoryAssetController.confirmInventoryAsset);
router.post('/confirm-inventory-asset-department', auth("confirmInventoryAsset"), inventoryAssetController.confirmInventoryAssetDepartment)
router.post('/send-asset-maintenances', auth("confirmInventoryAsset"), inventoryAssetController.sendAssetMaintenances);
router.delete('/delete', auth("deleteInventoryAsset"), inventoryAssetController.deleteInventoryAsset);
router.get('/get-list', auth("inventoryAsset"), inventoryAssetController.getInventoryAssets);
router.get('/my-inventory-assets', auth("inventoryAsset"), inventoryAssetController.getMyInventoryAssets);
router.get('/get-by-id', auth("inventoryAsset"), inventoryAssetController.getInventoryAssetById);
router.get('/get-inventory-asset-department-by-id', auth("inventoryAsset"), inventoryAssetController.getInventoryAssetDepartmentById);
router.patch('/update', auth("updateInventoryAsset"), inventoryAssetController.updateInventoryAsset);
router.patch('/update-status', auth("updateStatus"), inventoryAssetController.updateStatus);
router.get('/get-all', inventoryAssetController.getAllInventoryAsset);
module.exports = router;
