const express = require('express');

const auth = require('../../../middlewares/auth');
const { reportAssetDepreciationController } = require('../../../controllers');

const router = express.Router();

router.patch('/get-report', auth('getAssetDepreciationReport'), reportAssetDepreciationController.getAssetDepreciationReport);
router.patch('/get-detail-report', auth('getDetailAssetDepreciationReport'), reportAssetDepreciationController.getDetailAssetDepreciationReport);
router.patch('/get-full-report', auth('getFullAssetDepreciationReport'), reportAssetDepreciationController.getFullAssetDepreciationReport);

module.exports = router;