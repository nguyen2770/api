const express = require('express');
const { preventiveAssignUserController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/create', auth('createPreventiveTaskAssignUser'), preventiveAssignUserController.createPreventiveTaskAssignUser);

module.exports = router;
