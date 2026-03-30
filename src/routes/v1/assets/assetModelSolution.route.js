const express = require('express');
const { assetModelSolutionController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');
const multer = require('multer');

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post('/create', auth('createAssetModelSolution'), assetModelSolutionController.createAssetModelSolution);
router.get('/get-list', assetModelSolutionController.getAssetModelSolutions);
router.get('/get-by-id/:id', assetModelSolutionController.getAssetModelSolutionById);
router.patch('/update/:id', auth('updatessetModelSolution'), assetModelSolutionController.updateAssetModelSolution);
router.patch('/update-status/:id', auth('updateStatus'), assetModelSolutionController.updateStatus);
router.delete('/delete', auth('deleteAssetModelSolution'), assetModelSolutionController.deleteAssetModelSolution);
router.get('/get-all', assetModelSolutionController.getAllAssetModelSolution);
router.post('/upload-excel', auth('uploadAssetModelSolutionExcel'), upload.single("file"), assetModelSolutionController.uploadExcel);
module.exports = router;
