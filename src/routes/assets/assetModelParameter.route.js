const express = require('express');
const { assetModelParameterController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/create', auth('createAssetModelParameter'), assetModelParameterController.createAssetModelParameter);
router.get('/get-list', assetModelParameterController.getAssetModelParameters);
router.get('/get-by-id', assetModelParameterController.getAssetModelParameterById);
router.patch('/update/:id', auth('updatessetModelParameter'), assetModelParameterController.updateAssetModelParameter);
router.delete('/delete', auth('deleteAssetModelParameter'), assetModelParameterController.deleteAssetModelParameter);
router.get('/get-all', assetModelParameterController.getAllAssetModelParameter);
module.exports = router;
