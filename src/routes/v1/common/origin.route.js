const express = require('express');

const { originController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/create', auth('createOrigin'), originController.createOrigin);
router.get('/get-by-id', originController.getOriginById);
router.get('/get-all', originController.getAllOrigin);
module.exports = router;
