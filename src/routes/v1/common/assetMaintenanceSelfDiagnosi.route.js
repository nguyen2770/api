const express = require('express');
const { assetMaintenanceSelfDiagnosiController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/create', auth('createAssetMaintenanceSelfDiagnosi'), assetMaintenanceSelfDiagnosiController.createAssetMaintenanceSelfDiagnosi);
router.get('/get-by-id', assetMaintenanceSelfDiagnosiController.getAssetMaintenanceSelfDiagnosiById);
router.patch('/update', auth('updateAssetMaintenanceSelfDiagnosi'), assetMaintenanceSelfDiagnosiController.updateAssetMaintenanceSelfDiagnosi);
router.patch('/update-status', auth('updateStatus'), assetMaintenanceSelfDiagnosiController.updateStatus);
router.delete('/delete', auth('deleteAssetMaintenanceSelfDiagnosi'), assetMaintenanceSelfDiagnosiController.deleteAssetMaintenanceSelfDiagnosi);
router.get('/get-all', assetMaintenanceSelfDiagnosiController.getAllAssetMaintenanceSelfDiagnosi);
router.get('/get-res-by-id', assetMaintenanceSelfDiagnosiController.getResById);
module.exports = router;
