const express = require('express');
const { inventoryController } = require('../../../controllers');


const router = express.Router();

router.get('/get-spare-parts', inventoryController.getInventorySparePart)
router.get('/get-asset-models', inventoryController.getInventoryAssetModel)
router.post('/get-spare-parts-inventory', inventoryController.getInventorySpareParts)

router.get('/get-detail', inventoryController.getInventoryDetail)


module.exports = router;