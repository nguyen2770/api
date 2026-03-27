const express = require('express');
const { assetModelSeftDiagnosiaController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/create', auth('createAssetModelSeftDiagnosia'), assetModelSeftDiagnosiaController.createAssetModelSeftDiagnosia);
router.get('/get-list', assetModelSeftDiagnosiaController.getAssetModelSeftDiagnosias);
router.get('/get-by-id/:id', assetModelSeftDiagnosiaController.getAssetModelSeftDiagnosiaById);
router.patch('/update/:id', auth('updatessetModelSeftDiagnosia'), assetModelSeftDiagnosiaController.updateAssetModelSeftDiagnosia);
router.patch('/update-status/:id', auth('updateStatus'), assetModelSeftDiagnosiaController.updateStatus);
router.delete('/delete', auth('deleteAssetModelSeftDiagnosia'), assetModelSeftDiagnosiaController.deleteAssetModelSeftDiagnosia);
router.get('/get-all', assetModelSeftDiagnosiaController.getAllAssetModelSeftDiagnosia);
module.exports = router;
