const express = require('express');
const { assetMaintenanceSolutionBankController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/create', auth('createAssetMaintenanceSolutionBank'), assetMaintenanceSolutionBankController.createAssetMaintenanceSolutionBank);
router.get('/get-by-id', assetMaintenanceSolutionBankController.getAssetMaintenanceSolutionBankById);
router.patch('/update', auth('updateAssetMaintenanceSolutionBank'), assetMaintenanceSolutionBankController.updateAssetMaintenanceSolutionBank);
router.patch('/update-status', auth('updateStatus'), assetMaintenanceSolutionBankController.updateStatus);
router.delete('/delete', auth('deleteAssetMaintenanceSolutionBank'), assetMaintenanceSolutionBankController.deleteAssetMaintenanceSolutionBank);
router.get('/get-all', assetMaintenanceSolutionBankController.getAllAssetMaintenanceSolutionBank);
router.get('/get-res-by-id', assetMaintenanceSolutionBankController.getResById);
router.get('/get-defect-not-used', assetMaintenanceSolutionBankController.getDefectNotUsed);
module.exports = router;
