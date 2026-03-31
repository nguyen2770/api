const express = require('express');
const { cityController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/create', auth("createCity"), cityController.createCity);
router.get('/get-list', cityController.getCities);
router.get('/get-by-id', cityController.getCityById);
router.patch('/update', auth("updateCity"), cityController.updateCity);
router.delete('/delete', auth("deleteCity"), cityController.deleteCity);
router.get('/get-all', cityController.getAllCities);
router.get('/get-by-state-id', cityController.getCitiesByStateId);

module.exports = router;
