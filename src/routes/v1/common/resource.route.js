const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../../../middlewares/auth');

const { resourceController } = require('../../../controllers');

const router = express.Router();
// const uploadDir = 'E:/Project_MTC/2.api/uploads';

router.post('/create', auth('createResource'), resourceController.createResource);

// Upload ảnh
router.post('/upload-image', auth('uploadImage'), resourceController.saveImage, resourceController.uploadImage);

router.post(
    '/upload-document-breakdown',
    auth('saveDocumentBreakdown'),
    resourceController.saveDocumentBreakdown,
    resourceController.uploadDocumentBreakdown
);

// Lấy thông tin ảnh theo id
router.get('/image/:id', resourceController.getImage);

// Xóa ảnh theo id
router.delete('/image/:id', auth('deleteImage'), resourceController.deleteImage);
router.get('/get-size-used', auth('getSizeUsed'), resourceController.getSizeUsed);
router.get('/image/:id', resourceController.downloadImage);
router.get('/file-preview/:id', resourceController.previewResource)

module.exports = router;
