const express = require('express');
const { repairContractController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/create', auth('createRepairContract'), repairContractController.createRepairContract);
router.get('/get-list', auth('getRepairContracts'), repairContractController.getRepairContracts);
router.get('/get-by-id/:id', auth('getRepairContractById'), repairContractController.getRepairContractById);
router.delete('/delete/:id', auth('deleteRepairContractById'), repairContractController.deleteRepairContractById);
router.patch('/update', auth('updateRepairContractById'), repairContractController.updateRepairContractById);
router.patch(
    '/get-repair-contract-mapping-asset-maintenance',
    auth('getRepairContractMappingAssetMaintenancesByRes'),
    repairContractController.getRepairContractMappingAssetMaintenancesByRes
);
router.delete(
    '/delete-repair-contract-mapping-asset-maintenance-by-id/:id',
    auth('deleteRepairContractMappingAssetMaintenancesById'),
    repairContractController.deleteRepairContractMappingAssetMaintenancesById
);
router.post(
    '/create-repair-contract-mapping-asset-maintenance',
    auth('createRepairContractMappingAssetMaintenance'),
    repairContractController.createRepairContractMappingAssetMaintenance
);
router.patch('/get-all', auth('getAllRepairContractByRes'), repairContractController.getAllRepairContractByRes);
module.exports = router;
