const express = require('express');
const { stateController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/create', auth('createState'), stateController.createState);
router.get('/get-list', stateController.getStates);
router.get('/get-by-id', stateController.getStateById);
router.patch('/update', auth('updateState'), stateController.updateState);
router.delete('/delete', auth('deleteState'), stateController.deleteState);
router.get('/get-all', stateController.getAllStates);
router.post('/get-by-country-id', auth('getStateByContryId'), stateController.getStateByContryId);

module.exports = router;
