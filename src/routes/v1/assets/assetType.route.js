const express = require('express');
const { assetTypeController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/create', auth('createAssetType'), assetTypeController.createAssetType);
router.get('/get-list', assetTypeController.getAssetTypes);
router.get('/get-by-id', assetTypeController.getAssetTypeById);
router.patch('/update', auth('updatessetType'), assetTypeController.updateAssetType);
router.patch('/update-status', auth('updateStatus'), assetTypeController.updateStatus);
router.delete('/delete', auth('deleteAssetType'), assetTypeController.deleteAssetType);
router.get('/get-all', assetTypeController.getAllAssetType);
router.get('/get-by-asset', assetTypeController.getAllAssetTypeByAsset);

module.exports = router;
