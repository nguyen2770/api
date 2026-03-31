const httpStatus = require('http-status');
const { AssetModelFailureTypeModel, AssetModelSeftDiagnosiaModel, AssetModelSolutionModel } = require('../../models');
const ApiError = require('../../utils/ApiError');
const { prepareImportFile, rollbackImport } = require('../common/importData.service');
const XLSX = require("xlsx");
const fs = require("fs");

const createAssetModelFailureType = async (_assetModelFailureType) => {
    return AssetModelFailureTypeModel.create(_assetModelFailureType);
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
const queryAssetModelFailureTypes = async (filter, options) => {
    const assets = await AssetModelFailureTypeModel.paginate(filter, options);
    return assets;
};

/**
 * Get user by id
 * @param {ObjectId} id
 * @returns {Promise<User>}
 */
const getAssetModelFailureTypeById = async (id) => {
    return AssetModelFailureTypeModel.findById(id);
};
const getAssetModelFailureTypesUnusedSeftDiagnosia = async (modelId, ignoreIds = []) => {
    const assetModelSeftDiagnosias = await AssetModelSeftDiagnosiaModel.find({ assetModel: modelId });
    const typeIdsUsed = assetModelSeftDiagnosias.map((_item) => _item.assetModelFailureType);
    const assetModelFailureTypes = await AssetModelFailureTypeModel.find({
        assetModel: modelId, $or: [
            {
                _id: { "$nin": typeIdsUsed }
            }, {
                _id: { "$in": ignoreIds }
            }
        ]
    });
    return assetModelFailureTypes;
};
const getAssetModelFailureTypesUnusedSolution = async (modelId, ignoreIds = []) => {
    const assetModelSolutions = await AssetModelSolutionModel.find({ assetModel: modelId });
    const typeIdsUsed = assetModelSolutions.map((_item) => _item.assetModelFailureType);
    const assetModelFailureTypes = await AssetModelFailureTypeModel.find({
        assetModel: modelId, $or: [
            {
                _id: { "$nin": typeIdsUsed }
            }, {
                _id: { "$in": ignoreIds }
            }
        ]
    });
    return assetModelFailureTypes;
};
const updateAssetModelFailureTypeById = async (id, updateBody) => {
    const assetModelFailureType = await getAssetModelFailureTypeById(id);
    if (!assetModelFailureType) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Asset not found');
    }
    Object.assign(assetModelFailureType, updateBody);
    await assetModelFailureType.save();
    return assetModelFailureType;
};
const deleteAssetModelFailureTypeById = async (id) => {
    const assetModelFailureType = await getAssetModelFailureTypeById(id);
    if (!assetModelFailureType) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Asset not found');
    }
    await assetModelFailureType.remove();
    return assetModelFailureType;
};

const getAllAssetModelFailureType = async (filter) => {
    const assetModelFailureTypes = await AssetModelFailureTypeModel.find(filter);
    console.log(filter)
    return assetModelFailureTypes;
};
const uploadExcel = async (filePath, file, req) => {
    let importData;
    try {
        const { uploadDir, filePath: _filePath, resourceImportData } = await prepareImportFile(file, "asset_model_failure_type");
        const importData = resourceImportData;

        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        const docs = [];
        const errors = [];
        const warnings = [];
        const duplicateInFileChecker = new Set();

        const namesInFile = jsonData.map(r => r["Tên loại hỏng hóc"]);
        const existingAssetModelFailureTypes = await AssetModelFailureTypeModel.find({
            name: { $in: namesInFile }
        });
        const existingMap = new Map(existingAssetModelFailureTypes.map(m => [m.name, true]));

        for (const row of jsonData) {
            const stt = row.STT;
            const name = row["Tên loại hỏng hóc"] ? String(row["Tên loại hỏng hóc"]).trim() : "";
            if (!name) {
                errors.push(
                    `❌ Lỗi ở dòng có STT là: ${stt}`
                )
                continue;
            }
            if (duplicateInFileChecker.has(name)) {
                warnings.push(`⚠️ Dòng STT ${stt}: Loại hỏng hóc "${name}" bị lặp lại trong file.`);
                continue;
            }
            duplicateInFileChecker.add(name);
            if (existingMap.has(name)) {
                warnings.push(`⚠️ Dòng STT ${stt}: Loại hỏng hóc "${name}" đã tồn tại trong hệ thống.`);
                continue;
            }

            docs.push({
                name,
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
            await AssetModelFailureTypeModel.insertMany(docs);
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
    queryAssetModelFailureTypes,
    getAssetModelFailureTypeById,
    updateAssetModelFailureTypeById,
    deleteAssetModelFailureTypeById,
    createAssetModelFailureType,
    getAllAssetModelFailureType,
    getAssetModelFailureTypesUnusedSeftDiagnosia,
    getAssetModelFailureTypesUnusedSolution,
    uploadExcel,
};
