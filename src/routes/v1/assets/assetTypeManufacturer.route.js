const express = require('express');
const { assetTypeManufacturerController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/create', auth('createAssetTypeManufacturer'), assetTypeManufacturerController.createAssetTypeManufacturer);
router.get('/get-list', assetTypeManufacturerController.getAssetTypeManufacturers);
router.get('/get-by-id', assetTypeManufacturerController.getAssetTypeManufacturerById);
router.patch('/update', auth('updateAssetTypeManufacturer'), assetTypeManufacturerController.updateAssetTypeManufacturer);
router.delete('/delete', auth('deleteAssetTypeManufacturer'), assetTypeManufacturerController.deleteAssetTypeManufacturer);
router.get('/get-all', assetTypeManufacturerController.getAllAssetTypeManufacturer);
router.post('/update-assetType', auth('updateManufacturersOfAssetType'), assetTypeManufacturerController.updateManufacturersOfAssetType);
router.get('/get-by-assetType', assetTypeManufacturerController.getAssetTypeManufacturerByAssetType);
router.get('/get-by-asset', assetTypeManufacturerController.getAssetTypeManufacturerByAsset);

module.exports = router;
