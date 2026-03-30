const express = require('express');
const multer = require("multer");
const { floorController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post('/create', auth('createFloor'), floorController.createFloor);
router.get('/get-list', floorController.getFloors);
router.get('/get-by-id', floorController.getFloorById);
router.patch('/update', auth('updateFloor'), floorController.updateFloor);
router.patch('/update-status', auth('updateStatus'), floorController.updateStatus);
router.delete('/delete', auth('deleteFloor'), floorController.deleteFloor);
router.get('/get-all', floorController.getAllFloor);
router.post("/upload-floor", upload.single("file"), auth('uploadFloorExcel'), floorController.uploadFloorExcel);

module.exports = router;