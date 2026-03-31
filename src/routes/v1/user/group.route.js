const express = require('express');
const { groupController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/create', auth('createGroup'), groupController.createGroup);
router.get('/get-list', groupController.getGroups);
router.get('/get-by-id', groupController.getGroupById);
router.patch('/update', auth('updateGroup'), groupController.updateGroup);
router.patch('/update-status', auth('updateStatus'), groupController.updateStatus);
router.delete('/delete', auth('deleteGroup'), groupController.deleteGroup);
router.get('/get-all', groupController.getAllGroup);
module.exports = router;
