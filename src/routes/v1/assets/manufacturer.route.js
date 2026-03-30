const express = require('express');

const { manufacturerController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/create', auth('createManufacturer'), manufacturerController.createManufacturer);
router.get('/get-list', manufacturerController.getManufacturers);
router.get('/get-by-id', manufacturerController.getManufacturerById);
router.patch('/update', auth('updateManufacturer'), manufacturerController.updateManufacturer);
router.patch('/update-status', auth('updateStatus'), manufacturerController.updateStatus);
router.delete('/delete', auth('deleteManufacturer'), manufacturerController.deleteManufacturer);
router.get('/get-all', manufacturerController.getAllManufacturer);
module.exports = router;
