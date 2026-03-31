const express = require('express');
const { serviceController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();
router.get('/get-list', serviceController.getServices);
router.get('/get-all', serviceController.getAllServices);
router.get('/get/:id', serviceController.getServiceById);
router.post('/create', auth("createService"), serviceController.createService);
router.patch('/update-status/:id', auth("updateStatus"), serviceController.updateStatus);
router.patch('/update/:id', auth("updateService"), serviceController.updateService);
router.delete('/delete/:id', auth("deleteService"), serviceController.deleteService);
module.exports = router;
