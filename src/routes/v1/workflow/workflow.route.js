const express = require('express');
const { workflowController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();
router.get('/get-all', workflowController.getAllWorkflows);
router.get('/get-by-id/:id', workflowController.getWorkflowById);
router.patch('/update/:id', auth('updateWorkflow'), workflowController.updateWorkflow);
module.exports = router;
