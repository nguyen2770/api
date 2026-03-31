const express = require('express');
const { serviceContractorController } = require('../../../controllers');
// const auth = require('../../../middlewares/auth');
const auth = require('../../../middlewares/auth');
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

const router = express.Router();
router.get('/get-list', serviceContractorController.getServiceContractors);
router.get('/get-all', serviceContractorController.getAllServiceContractors);
router.post('/create', auth("createServiceContractor"), serviceContractorController.createServiceContractor);
router.patch('/update-status/:id', auth("updateStatus"), serviceContractorController.updateStatus);
router.patch('/update/:id', auth("updateServiceContractor"), serviceContractorController.updateServiceContractor);
router.delete('/delete/:id', auth("deleteServiceContractor"), serviceContractorController.deleteServiceContractor);
// usser mapping
router.post('/create-user-mapping', auth("createServiceContractorUserMapping"), serviceContractorController.createServiceContractorUserMapping);
router.patch('/update-user-mapping/:id', auth("updateServiceContractorUserMappingById"), serviceContractorController.updateServiceContractorUserMappingById);
router.delete('/delete-user-mapping/:id', auth("deleteServiceContractorUserMappingById"), serviceContractorController.deleteServiceContractorUserMappingById);
router.get('/get-user-mapping-by-res', serviceContractorController.getServiceContractorUserMappingByRes);
router.get('/get-user-not-in-service-contractor-user-mapping', serviceContractorController.getListUserNotInServiceContractUserMapping);
router.post("/upload-service-contractor", upload.single("file"), auth('uploadServiceContractorExcel'), serviceContractorController.uploadServiceContractorExcel);
module.exports = router;
