const express = require('express');
const auth = require('../../../middlewares/auth');
const multer = require("multer");
// const validate = require('../../../middlewares/validate');
// const userValidation = require('../../../validations/authentication/user.validation');
const userController = require('../../../controllers/authentication/user.controller');

const router = express.Router();
const upload = multer({ dest: "uploads/" });
router.get('/get-all', userController.getAllUser);

router.get('/getAll', userController.getAllUser);
router.route('/create').post(auth('manageUsers'), userController.createUser);
router.route('/get-list').get(auth('getUsers'), userController.getUsers);
router.route('/get-list_ks').get(auth('getUsers'), userController.getListKs);
router.route('/get-company-by-code/:code').patch(auth('getCompanyByCode'), userController.getCompanyByCode);

router.patch('/update-status', userController.updateStatus);
router.patch('/save-device-token', userController.saveDeviceMobile);
router.post('/verify-app', auth('getDataUser'), userController.verifyApp);
router.get('/get-by-id/:userId', userController.getUserById);
router.get('/get-permissions', auth('getPermissions'), userController.getPermissions);
router.get('/get-permission-by-user', auth('getPermissisonByUsers'), userController.getPermissisonByUsers);
router.patch('/update/:userId', auth('updateUser'), userController.updateUser);
router.patch('/update-branchs/:userId', auth('updateBranchs'), userController.updateUserBranchs);
router.patch('/update-company-setting', auth('updateCompanySetting'), userController.updateCompanySetting);
router.patch('/get-branchs/:userId', auth('verifyEmgetUserBranchsail'), userController.getUserBranchs);
router.get('/get-data-user', auth('getDataUser'), userController.getDataUser);
router.delete('/delete/:userId', auth('deleteUser'), userController.deleteUser);
router.get('/get-by-id-populate/:userId', userController.getUserByIdPopulate);
router.patch('/save-device/:userId', auth('saveDeviceMobile'), userController.saveDeviceMobile);
router.get('/get-company-by-code-not-auth/:code', userController.getCompanyByCode);
router.post("/upload-user", upload.single("file"), auth('uploadUserExcel'), userController.uploadUserExcel);
module.exports = router;
