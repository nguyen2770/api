const express = require('express');
const { assetMaintenanceCustomerController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/create', auth('createAssetMaintenanceCustomer'), assetMaintenanceCustomerController.createAssetMaintenanceCustomer);
router.get('/get-assetMaintenance-by-customer', assetMaintenanceCustomerController.getMaintenances);
router.delete('/delete', auth('deleteAssetMaintenanceCustomer'), assetMaintenanceCustomerController.deleteAssetMaintenanceCustomer);
router.get('/get-unassigned-asset-by-customer', assetMaintenanceCustomerController.getUnassignedAssetMaintenancesByCustomerId);


module.exports = router;