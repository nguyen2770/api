const express = require('express');
const { stockLocationController } = require('../../../controllers');

const router = express.Router();

router.post('/create', stockLocationController.createStockLocation);
router.patch('/update', stockLocationController.updateStockLocation);
router.get('/get-list', stockLocationController.queryStockLocation);


module.exports = router;