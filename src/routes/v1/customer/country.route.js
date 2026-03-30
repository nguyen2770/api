const express = require('express');
const { countryController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/create', auth("createCountry"), countryController.createCountry);
router.get('/get-list', countryController.getCountries);
router.get('/get-by-id', countryController.getCountryById);
router.patch('/update', auth("updateCountry"), countryController.updateCountry);
router.delete('/delete', auth("deleteCountry"), countryController.deleteCountry);
router.get('/get-all', countryController.getAllCountries);

module.exports = router;
