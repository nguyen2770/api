const express = require("express");
const multer = require("multer");
const { importDataController } = require("../../../controllers");
const auth = require("../../../middlewares/auth");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post(
  "/upload",
  upload.single("file"),
  auth('uploadAssetMaintenanceExcel'),
  importDataController.uploadAssetMaintenanceExcel
);
router.post("/upload-category", upload.single("file"), auth('uploadCategoryExcel'), importDataController.uploadCategoryExcel);
router.post("/upload-sub-category", upload.single("file"), auth('uploadSubCategoryExcel'), importDataController.uploadSubCategoryExcel);
router.post("/upload-asset", upload.single("file"), auth('uploadAssetExcel'), importDataController.uploadAssetExcel);
router.post("/upload-spare-category", upload.single("file"), auth('uploadSpareCategoryExcel'), importDataController.uploadSpareCategoryExcel);
router.post("/upload-spare-sub-category", upload.single("file"), auth('uploadSpareSubCategoryExcel'), importDataController.uploadSpareSubCategoryExcel);
router.post("/upload-manufacturer", upload.single("file"), auth('uploadManufacturerExcel'), importDataController.uploadManufacturerExcel);

module.exports = router;
