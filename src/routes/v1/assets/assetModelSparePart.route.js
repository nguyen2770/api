const express = require('express');
const { assetModelSparePartController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/create', auth('createAssetModelSparePart'), assetModelSparePartController.createAssetModelSparePart);
router.get('/get-by-id', assetModelSparePartController.getAssetModelSparePartById);
router.patch('/update', auth('updateAssetModelSparePart'), assetModelSparePartController.updateAssetModelSparePart);
router.delete('/delete', auth('deleteAssetModelSparePart'), assetModelSparePartController.deleteAssetModelSparePart);
router.get('/get-all', assetModelSparePartController.getAllAssetModelSparePart);
router.get('/get-res-by-id', assetModelSparePartController.getResById);
module.exports = router;
