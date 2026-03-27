const express = require('express');
const { calibrationContractController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/create', auth('createCalibrationContract'), calibrationContractController.createCalibrationContract);
router.patch('/get-list', auth('getCalibrationContracts'), calibrationContractController.getCalibrationContracts);
router.get('/get-by-id/:id', auth('getCalibrationContractById'), calibrationContractController.getCalibrationContractById);
router.patch('/delete/:id', auth('deleteCalibrationContract'), calibrationContractController.deleteCalibrationContract);
router.patch('/update', auth('updateCalibrationContract'), calibrationContractController.updateCalibrationContract);
router.post(
    '/create-calibration-contract-mapping-asset-maintenance',
    auth('createCalibrationContractMappingAssetMaintenance'),
    calibrationContractController.createCalibrationContractMappingAssetMaintenance
);
router.patch(
    '/get-calibration-contract-mapping-asset-maintenance-by-res',
    auth('getCalibrationContractMappingAssetMaintenanceByRes'),
    calibrationContractController.getCalibrationContractMappingAssetMaintenanceByRes
);
router.patch(
    '/delete-calibration-contract-mapping-asset-maintenance/:id',
    auth('deleteCalibrationContractMappingAssetMaintenance'),
    calibrationContractController.deleteCalibrationContractMappingAssetMaintenance
);
module.exports = router;
