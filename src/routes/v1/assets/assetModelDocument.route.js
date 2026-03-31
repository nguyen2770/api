const express = require('express');
const { assetModelDocumentController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/create', auth('createAssetDocuments'), assetModelDocumentController.createAssetDocuments);
router.get('/get-list', assetModelDocumentController.queryAssetModelDocuments);
router.get('/get-by-id', assetModelDocumentController.findAssetModelDocumentById);
router.patch('/update/:id', auth('updateAssetModelDocument'), assetModelDocumentController.updateAssetModelDocument);
router.delete('/delete', auth('deleteAssetModelDocument'), assetModelDocumentController.deleteAssetModelDocument);
router.get('/getAll', assetModelDocumentController.getAllAssetModelDocByAssetModel);
module.exports = router;