const express = require('express');
const { assetController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/create', auth('createAsset'), assetController.createAsset);
router.get('/get-list', assetController.getAssets);
router.get('/get-by-id', assetController.getAssetById);
router.patch('/update', auth('updateAsset'), assetController.updateAsset);
router.patch('/update-status', auth('updateStatus'), assetController.updateStatus);
router.delete('/delete', auth('deleteAsset'), assetController.deleteAsset);
router.get('/get-all', assetController.getAllAsset);
router.get('/get-by-res', assetController.getAssetByRes);
module.exports = router;
