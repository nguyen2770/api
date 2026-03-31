const express = require('express');
const { servicePackageController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();
router.get('/get-list', servicePackageController.getServicePackages);
router.get('/get-all', servicePackageController.getAllServicePackages);
router.get('/get/:id', servicePackageController.getServicePackageById);
router.post('/create', auth("createServicePackage"), servicePackageController.createServicePackage);
router.patch('/update-status/:id', auth("updateStatus"), servicePackageController.updateStatus);
router.patch('/update/:id', auth("updateServicePackage"), servicePackageController.updateServicePackage);
router.delete('/delete/:id', auth("deleteServicePackage"), servicePackageController.deleteServicePackage);
module.exports = router;
