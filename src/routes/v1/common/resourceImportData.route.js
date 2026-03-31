const express = require('express');
const auth = require('../../../middlewares/auth');

const { resourceImportDataController } = require('../../../controllers');

const router = express.Router();
// const uploadDir = 'E:/Project_MTC/2.api/uploads';
router.post('/create', auth('createResourceImportData'), resourceImportDataController.createResourceImportData);
// Upload ảnh
router.post('/upload-image', auth('uploadImage'), resourceImportDataController.saveDocumentResourceImportData, resourceImportDataController.uploadDocumentResourceImportData);
// Lấy thông tin ảnh theo id
router.get('/image/:id', resourceImportDataController.getDocumentResourceImportData);
// Xóa ảnh theo id
router.delete('/image/:id', auth('deleteDocumentResourceImportData'), resourceImportDataController.deleteDocumentResourceImportData);
router.get('/get-lits-assetMaintenance', resourceImportDataController.getListResourceImportDataAssetMaintenance);
router.patch('/comfirm-colse-delele', auth('confirmCloseFileDeletion'), resourceImportDataController.confirmCloseFileDeletion);
router.patch('/comfirm-delele-file', auth('confirmDeleteFile'), resourceImportDataController.confirmDeleteFile);
module.exports = router;
