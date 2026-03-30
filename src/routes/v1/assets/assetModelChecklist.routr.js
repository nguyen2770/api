const express = require('express');
const { assetModelChecklistController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/create', auth('createAssetModelChecklist'), assetModelChecklistController.createAssetModelChecklist);
router.patch('/update/:assetModelId', auth('updateAssetModelChecklist'), assetModelChecklistController.updateAssetModelChecklist);
router.patch('/get-by-res', auth('getAssetModelChecklistByRes'), assetModelChecklistController.getAssetModelChecklistByRes);
module.exports = router;
