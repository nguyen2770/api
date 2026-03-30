const path = require('path');
const httpStatus = require('http-status');
const fs = require('fs');
const multer = require('multer');
const { importDataService } = require('../../services');

const uploadAssetMaintenanceExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.send({ code: 0, message: 'Not file' });
        }
        const result = await importDataService.uploadAssetMaintenanceExcel(
            req.file.path,
            req.file,
            req.company,
            req.companySetting
        );
        return res.send({ code: 1, result });
    } catch (error) {
        return res.send({ code: 0, message: error.message || 'Tải file lên không thành công' });
    }
};

const uploadCategoryExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.send({ code: 0, message: 'Not file' });
        }
        const result = await importDataService.uploadCategoryExcel(req.file.path, req.file);
        return res.send({ code: 1, result });
    } catch (error) {
        return res.send({ code: 0, message: error.message || 'Tải file lên không thành công' });
    }
};

const uploadSubCategoryExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.send({ code: 0, message: 'Not file' });
        }
        const result = await importDataService.uploadSubCategoryExcel(req.file.path, req.file);
        return res.send({ code: 1, result });
    } catch (error) {
        return res.send({ code: 0, message: error.message || 'Tải file lên không thành công' });
    }
};

const uploadAssetExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.send({ code: 0, message: 'Not file' });
        }
        const result = await importDataService.uploadAssetExcel(req.file.path, req.file);
        return res.send({ code: 1, result });
    } catch (error) {
        return res.send({ code: 0, message: error.message || 'Tải file lên không thành công' });
    }
};

const uploadSpareCategoryExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.send({ code: 0, message: 'Not file' });
        }
        const result = await importDataService.uploadSpareCategoryExcel(req.file.path, req.file);
        return res.send({ code: 1, result });
    } catch (error) {
        return res.send({ code: 0, message: error.message || 'Tải file lên không thành công' });
    }
};

const uploadSpareSubCategoryExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.send({ code: 0, message: 'Not file' });
        }
        const result = await importDataService.uploadSpareSubCategoryExcel(req.file.path, req.file);
        return res.send({ code: 1, result });
    } catch (error) {
        return res.send({ code: 0, message: error.message || 'Tải file lên không thành công' });
    }
};

const uploadManufacturerExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.send({ code: 0, message: 'Not file' });
        }
        const result = await importDataService.uploadManufacturerExcel(req.file.path, req.file);
        return res.send({ code: 1, result });
    } catch (error) {
        return res.send({ code: 0, message: error.message || 'Tải file lên không thành công' });
    }
};

module.exports = {
    uploadAssetMaintenanceExcel,
    uploadCategoryExcel,
    uploadSubCategoryExcel,
    uploadAssetExcel,
    uploadSpareCategoryExcel,
    uploadSpareSubCategoryExcel,
    uploadManufacturerExcel,
};
