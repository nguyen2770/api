const express = require('express');
const multer = require("multer");
const { departmentController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post('/create', auth('createDepartment'), departmentController.createDepartment);
router.get('/get-list', departmentController.getDepartments);
router.get('/get-by-id', departmentController.getDepartmentById);
router.patch('/update', auth('updateDepartment'), departmentController.updateDepartment);
router.patch('/update-status', auth('updateStatus'), departmentController.updateStatus);
router.delete('/delete', auth('deleteDepartment'), departmentController.deleteDepartment);
router.get('/get-all', departmentController.getAllDepartment);
router.post("/upload-department", upload.single("file"), auth('uploadDepartmentExcel'), departmentController.uploadDepartmentExcel);

module.exports = router;