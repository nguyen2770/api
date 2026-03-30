const express = require('express');
const { amcController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/create', auth('createAmc'), amcController.createAmc);
router.get('/get-list', amcController.getAmcs);
router.get('/get-by-id/:id', amcController.getAmcById);
router.patch('/update/:id', auth('updateAmc'), amcController.updateAmc);
router.patch('/update-status', auth('updateStatus'), amcController.updateStatus);
router.delete('/delete/:id', auth('deleteAmc'), amcController.deleteAmc);
router.get('/get-all', amcController.getAllAmcs);
router.get('/total-amc-by-state', amcController.totalAmcByState);
router.post(
    '/create-amc-mapping-asset-maintanance',
    auth('createAmcMappingAssetMaintenance'),
    amcController.createAmcMappingAssetMaintenance
);
router.patch(
    '/get-amc-mapping-asset-maintanance-by-res',
    auth('getAmcMappingAssetMaintenanceByRes'),
    amcController.getAmcMappingAssetMaintenanceByRes
);
router.delete(
    '/delete-amc-mapping-asset-maintanance/:id',
    auth('deleteAmcMappingAssetMaintenance'),
    amcController.deleteAmcMappingAssetMaintenance
);
router.patch('/get-amc-service-task-by-amc', auth('getAmcServiceTasksByAmc'), amcController.getAmcServiceTasksByAmc);
module.exports = router;
