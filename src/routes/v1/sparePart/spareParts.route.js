const express = require('express');
const { sparePartsController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');
const multer = require('multer');

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post('/create', auth("createSparePart"), sparePartsController.createSparePart);
router.get('/list', sparePartsController.getSpareParts);
router.get('/get-by-id', sparePartsController.getSparePartById);
router.patch('/update', auth("updateSparePart"), sparePartsController.updateSparePart);
router.patch('/update-status', auth('updateStatus'), sparePartsController.updateStatus);
router.delete('/delete', auth('deleteSparePart'), sparePartsController.deleteSparePart);
router.get('/get-all', sparePartsController.getAllSpareParts);
router.get('/list-details', sparePartsController.getSparePartDetails);
router.get('/get-detail-by-qrcode', sparePartsController.getSparePartDetailByQrCode);
router.patch('/update-detail-by-qrcode', auth('updateSparePartDetailByQrCode'), sparePartsController.updateSparePartDetailByQrCode);
router.post('/upload-spare-part', upload.single("file"), auth('uploadExcel'), sparePartsController.uploadExcel);

module.exports = router;