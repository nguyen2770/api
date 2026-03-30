const httpStatus = require('http-status');
const UomModel = require('../../models/common/uom.model');
const ApiError = require('../../utils/ApiError');
const { Uom } = require('../../models');
const { rollbackImport, prepareImportFile } = require('./importData.service');
const XLSX = require("xlsx");
const fs = require("fs");

const createUom = async (data) => {
    const uom = await UomModel.create(data);
    return uom;
}
const getUomById = async (id) => {
    const uom = await UomModel.findById(id);
    return uom;
}
const updateById = async (id, taxGroup) => {
    const a = await UomModel.findByIdAndUpdate(id, taxGroup)
    return a;
}
const deleteId = async (id) => {
    const taxGroup = await getUomById(id);
    if (!taxGroup) {
        throw new ApiError(httpStatus.NOT_FOUND, 'taxGroup not found');
    }
    await taxGroup.remove();
    return taxGroup;
}
const getAllUom = async () => {
    const categorys = await UomModel.find();
    return categorys;
};

const queryUoms = async (filter, options) => {
    const uoms = await Uom.paginate(filter, options);
    return uoms;
}
const uploadUomExcel = async (filePath, file) => {
    let importData;
    try {
        const { uploadDir, filePath: _filePath, resourceImportData } = await prepareImportFile(file, "uom");
        const importData = resourceImportData;

        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        const docs = [];
        const errors = [];
        const warnings = [];
        const duplicateInFileChecker = new Set();

        const namesInFile = jsonData.map(r => r["Tên đơn vị"]);
        const existingUoms = await Uom.find({
            uomName: { $in: namesInFile }
        });
        const existingMap = new Map(existingUoms.map(m => [m.uomName, true]));

        for (const row of jsonData) {
            const stt = row.STT;
            const uomName = row["Tên đơn vị"] ? String(row["Tên đơn vị"]).trim() : "";
            if (!uomName) {
                errors.push(
                    `❌ Lỗi ở dòng có STT là: ${stt}`
                )
                continue;
            }
            if (duplicateInFileChecker.has(uomName)) {
                warnings.push(`⚠️ Dòng STT ${stt}: Đơn vị "${uomName}" bị lặp lại trong file.`);
                continue;
            }
            duplicateInFileChecker.add(uomName);
            if (existingMap.has(uomName)) {
                warnings.push(`⚠️ Dòng STT ${stt}: Đơn vị "${uomName}" đã tồn tại trong hệ thống.`);
                continue;
            }

            docs.push({
                uomName,
                resourceImportData: resourceImportData._id,
            });
        }

        if (errors.length > 0) {
            await rollbackImport(importData._id, filePath)
            return { success: false, errors };
        }
        if (docs.length > 0) {
            await Uom.insertMany(docs);
        }
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        fs.renameSync(filePath, _filePath);
        return {
            success: true,
            insertCount: docs.length,
            warnings: warnings.length > 0 ? warnings : null
        };
    } catch (error) {
        if (importData) {
            await rollbackImport(importData._id, filePath);
        }
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
    }
}

module.exports = {
    getAllUom,
    getUomById,
    createUom,
    updateById,
    deleteId,
    queryUoms,
    uploadUomExcel,
};
