const express = require('express');
const { assetModelSeftDiagnosiaController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');
const multer = require('multer');

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post('/create', auth('createAssetModelSeftDiagnosia'), assetModelSeftDiagnosiaController.createAssetModelSeftDiagnosia);
router.get('/get-list', assetModelSeftDiagnosiaController.getAssetModelSeftDiagnosias);
router.get('/get-by-id/:id', assetModelSeftDiagnosiaController.getAssetModelSeftDiagnosiaById);
router.patch('/update/:id', auth('updatessetModelSeftDiagnosia'), assetModelSeftDiagnosiaController.updateAssetModelSeftDiagnosia);
router.patch('/update-status/:id', auth('updateStatus'), assetModelSeftDiagnosiaController.updateStatus);
router.delete('/delete', auth('deleteAssetModelSeftDiagnosia'), assetModelSeftDiagnosiaController.deleteAssetModelSeftDiagnosia);
router.get('/get-all', assetModelSeftDiagnosiaController.getAllAssetModelSeftDiagnosia);
router.post('/upload-excel', auth('uploadAssetModelSeftDiagnosiaExcel'), upload.single("file"), assetModelSeftDiagnosiaController.uploadExcel);
module.exports = router;
