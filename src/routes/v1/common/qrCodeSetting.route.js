const express = require('express');
const qrCodeSettingController = require('../../../controllers/common/qrCodeSetting.controller');

const router = express.Router();

router.get('/get-all', qrCodeSettingController.getQrCodeSettings);

module.exports = router;