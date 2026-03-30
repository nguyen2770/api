const httpStatus = require('http-status');
const { AssetModelParameterModel } = require('../../models');
const ApiError = require('../../utils/ApiError');
const { prepareImportFile, rollbackImport } = require('../common/importData.service');
const XLSX = require("xlsx");
const fs = require("fs");

const createAssetModelParameter = async (_assetModelParameter) => {
    return AssetModelParameterModel.create(_assetModelParameter);
};

/**
 * Query for users
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryAssetModelParameters = async (filter, options) => {
    const assets = await AssetModelParameterModel.paginate(filter, options);
    return assets;
};

/**
 * Get user by id
 * @param {ObjectId} id
 * @returns {Promise<User>}
 */
const getAssetModelParameterById = async (id) => {
    return AssetModelParameterModel.findById(id);
};

const updateAssetModelParameterById = async (id, updateBody) => {
    const assetModelParameter = await getAssetModelParameterById(id);
    if (!assetModelParameter) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Asset not found');
    }
    Object.assign(assetModelParameter, updateBody);
    await assetModelParameter.save();
    return assetModelParameter;
};
const deleteAssetModelParameterById = async (id) => {
    const assetModelParameter = await getAssetModelParameterById(id);
    if (!assetModelParameter) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Asset not found');
    }
    await assetModelParameter.remove();
    return assetModelParameter;
};

const getAllAssetModelParameter = async (filter) => {
    const assetModelParameters = await AssetModelParameterModel.find(filter);
    return assetModelParameters;
};
const uploadExcel = async (filePath, file, req) => {
    let importData;
    try {
        const { uploadDir, filePath: _filePath, resourceImportData } = await prepareImportFile(file, "asset_model_parameter");
        const importData = resourceImportData;

        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        const docs = [];
        const errors = [];
        const warnings = [];
        const duplicateInFileChecker = new Set();

        const namesInFile = jsonData.map(r => r["Tên thông số"]);
        const existingAssetModelParameters = await AssetModelParameterModel.find({
            name: { $in: namesInFile }
        });
        const existingMap = new Map(existingAssetModelParameters.map(m => [`${m.name}-${m.value}`, true]));

        for (const row of jsonData) {
            const stt = row.STT;
            const name = row["Tên thông số"] ? String(row["Tên thông số"]).trim() : "";
            const value = row["Giá trị"] ? String(row["Giá trị"]).trim() : "";
            if (!name || !value) {
                errors.push(
                    `❌ Lỗi ở dòng có STT là: ${stt}`
                )
                continue;
            }
            const fileKey = `${name}-${value}`;
            if (duplicateInFileChecker.has(fileKey)) {
                warnings.push(`⚠️ Dòng STT ${stt}: Thông số "${name}" với giá trị "${value}" bị lặp lại trong file.`);
                continue;
            }
            duplicateInFileChecker.add(fileKey);
            if (existingMap.has(fileKey)) {
                warnings.push(`⚠️ Dòng STT ${stt}: Thông số "${name}" với giá trị "${value}" đã tồn tại trong hệ thống.`);
                continue;
            }

            docs.push({
                name,
                value,
                assetModel: req.body.assetModel,
                createdBy: req.user.id,
                updatedBy: req.user.id,
                // resourceImportData: resourceImportData._id,
            });
        }

        if (errors.length > 0) {
            await rollbackImport(importData._id, filePath)
            return { success: false, errors };
        }
        if (docs.length > 0) {
            await AssetModelParameterModel.insertMany(docs);
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
    queryAssetModelParameters,
    getAssetModelParameterById,
    updateAssetModelParameterById,
    deleteAssetModelParameterById,
    createAssetModelParameter,
    getAllAssetModelParameter,
    uploadExcel,
};
