const express = require('express');
const { regionController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/create', auth('createRegion'), regionController.createRegion);
router.get('/get-list', regionController.getRegions);
router.get('/get-by-id', regionController.getRegionById);
router.patch('/update', auth('updateRegion'), regionController.updateRegion);
router.delete('/delete', auth('deleteRegion'), regionController.deleteRegion);
router.get('/get-all', regionController.getAllRegions);

module.exports = router;
