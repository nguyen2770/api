const express = require('express');
const { assetModelParameterController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');
const multer = require('multer');

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post('/create', auth('createAssetModelParameter'), assetModelParameterController.createAssetModelParameter);
router.get('/get-list', assetModelParameterController.getAssetModelParameters);
router.get('/get-by-id', assetModelParameterController.getAssetModelParameterById);
router.patch('/update/:id', auth('updatessetModelParameter'), assetModelParameterController.updateAssetModelParameter);
router.delete('/delete', auth('deleteAssetModelParameter'), assetModelParameterController.deleteAssetModelParameter);
router.get('/get-all', assetModelParameterController.getAllAssetModelParameter);
router.post('/upload-asset-model-parameter', auth('uploadAssetModelParameterExcel'), upload.single("file"), assetModelParameterController.uploadExcel);
module.exports = router;
