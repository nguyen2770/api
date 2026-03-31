const express = require('express');
const { roleController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');
const router = express.Router();

router.get('/get-all', roleController.getAllRole);
router.post('/create', auth("createRole"), roleController.createRole);
router.patch('/update/:id', auth("updateRole"), roleController.updateRole);
router.delete('/delete/:id', auth("deleteRole"), roleController.deleteRole);
router.get('/get-role-permissions/:id', auth("getRolePermissions"), roleController.getRolePermissions);
router.patch('/update-role-permissions/:id', auth("updateRolePermissions"), roleController.updateRolePermissions);
module.exports = router;
