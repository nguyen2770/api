const express = require('express');
const { assetModelFailureTypeController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');
const multer = require('multer');

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post('/create', auth('createAssetModelFailureType'), assetModelFailureTypeController.createAssetModelFailureType);
router.get('/get-list', assetModelFailureTypeController.getAssetModelFailureTypes);
router.post('/get-list-unused-seft-diagnosia', auth('getAssetModelFailureTypesUnusedSeftDiagnosia'), assetModelFailureTypeController.getAssetModelFailureTypesUnusedSeftDiagnosia);
router.post('/get-list-unused-solution', auth('getAssetModelFailureTypesUnusedSolution'), assetModelFailureTypeController.getAssetModelFailureTypesUnusedSolution);
router.get('/get-by-id', assetModelFailureTypeController.getAssetModelFailureTypeById);
router.patch('/update/:id', auth('updatessetModelFailureType'), assetModelFailureTypeController.updateAssetModelFailureType);
router.delete('/delete', auth('deleteAssetModelFailureType'), assetModelFailureTypeController.deleteAssetModelFailureType);
router.get('/get-all', assetModelFailureTypeController.getAllAssetModelFailureType);
router.post('/upload-excel', auth('uploadAssetModelFailureTypeExcel'), upload.single("file"), assetModelFailureTypeController.uploadExcel);
module.exports = router;
