const express = require('express');
const { assetModelController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/create', auth('createAssetModel'), assetModelController.createAssetModel);
router.get('/get-list', assetModelController.getAssetModel);
router.get('/get-by-id/:id', assetModelController.getAssetModelById);
router.get('/get-by-assetId', assetModelController.getAssetModelByAssetId)
router.patch('/update/:id', auth('updateAssetModel'), assetModelController.updateAssetModel);
router.patch('/update-status/:id', auth('updateAssetModelStatus'), assetModelController.updateAssetModelStatus);
router.delete('/delete', auth('deleteAssetModel'), assetModelController.deleteAssetModel);
router.get('/get-all', assetModelController.getAllAssetModel);
router.get('/get-assetType-assetType-asset', assetModelController.getAssetModelByAssetTypeAndAsset);
module.exports = router;
