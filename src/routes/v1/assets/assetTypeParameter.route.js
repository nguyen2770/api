const express = require('express');
const { assetTypeParameterController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/create', auth('createAssetTypeParameter'), assetTypeParameterController.createAssetTypeParameter);
router.get('/get-list', assetTypeParameterController.getAssetTypeParameters);
router.get('/get-by-id', assetTypeParameterController.getAssetTypeParameterById);
router.patch('/update/:id', auth('updatessetTypeParameter'), assetTypeParameterController.updateAssetTypeParameter);
router.delete('/delete', auth('deleteAssetTypeParameter'), assetTypeParameterController.deleteAssetTypeParameter);
router.get('/get-all', assetTypeParameterController.getAllAssetTypeParameter);
module.exports = router;
