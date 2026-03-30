const express = require('express');
const multer = require("multer");
const { uomController } = require('../../../controllers')
const auth = require('../../../middlewares/auth');

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.get('/get-list', uomController.getUoms);
router.get('/get-all', uomController.getAllUom);
router.get('/get-by-id', uomController.getUomById)
router.post('/create', auth('createUom'), uomController.createUom);
router.patch('/update', auth('updateUom'), uomController.updateUom);
router.delete('/delete', auth("deleteUom"), uomController.deleteUom);
router.post('/upload-uom', upload.single("file"), auth("uploadUomExcel"), uomController.uploadUomExcel);
module.exports = router;
