const express = require('express');
const multer = require("multer");
const { buildingController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post('/create', auth("createBuilding"), buildingController.createBuilding);
router.get('/get-list', buildingController.getBuildings);
router.get('/get-by-id', buildingController.getBuildingById);
router.patch('/update', auth("updateBuilding"), buildingController.updateBuilding);
router.patch('/update-status', auth("updateStatus"), buildingController.updateStatus);
router.delete('/delete', auth("deleteBuilding"), buildingController.deleteBuilding);
router.get('/get-all', buildingController.getAllBuilding);
router.post("/upload-building", upload.single("file"), auth('uploadBuildingExcel'), buildingController.uploadBuildingExcel);

module.exports = router;