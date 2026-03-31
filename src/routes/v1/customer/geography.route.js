const express = require('express');
const { geographyController } = require('../../../controllers');

const router = express.Router();


router.get('/get-all-communes', geographyController.getAllCommunes);
router.get('/get-all-communes-by-province', geographyController.getAllCommunesByProvince);
router.get('/get-all-provinces', geographyController.getAllProvinces);


module.exports = router;