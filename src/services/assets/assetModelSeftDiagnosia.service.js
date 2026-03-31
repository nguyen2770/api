const httpStatus = require('http-status');
const { AssetModelSeftDiagnosiaModel, AssetModelSeftDiagnosiaAnswerValueModel, AssetModelSeftDiagnosiaTagModel, AssetModelFailureTypeModel } = require('../../models');
const ApiError = require('../../utils/ApiError');
const XLSX = require("xlsx");
const fs = require("fs");
const { rollbackImport, prepareImportFile } = require('../common/importData.service');

const createAssetModelSeftDiagnosia = async (_assetModelSeftDiagnosia, tags, assetModelSeftDiagnosiaAnswerValues) => {
    const assetModelSeftDiagnosia = await AssetModelSeftDiagnosiaModel.create(_assetModelSeftDiagnosia);
    //
    if (tags && tags.length > 0) {
        tags.forEach(item => {
            item.assetModelSeftDiagnosia = assetModelSeftDiagnosia._id;
        });
        await AssetModelSeftDiagnosiaTagModel.insertMany(tags);
    }
    if (assetModelSeftDiagnosiaAnswerValues && assetModelSeftDiagnosiaAnswerValues.length > 0) {
        assetModelSeftDiagnosiaAnswerValues.forEach(item => {
            item.assetModelSeftDiagnosia = assetModelSeftDiagnosia._id;
        });
        await AssetModelSeftDiagnosiaAnswerValueModel.insertMany(assetModelSeftDiagnosiaAnswerValues);
    }
    return assetModelSeftDiagnosia;
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
const queryAssetModelSeftDiagnosias = async (filter, options) => {
    const assets = await AssetModelSeftDiagnosiaModel.paginate(filter, options);
    return assets;
};

/**
 * Get user by id
 * @param {ObjectId} id
 * @returns {Promise<User>}
 */
const getAssetModelSeftDiagnosiaById = async (id) => {
    return AssetModelSeftDiagnosiaModel.findById(id);
};

const updateAssetModelSeftDiagnosiaById = async (id, _assetModelSeftDiagnosia, tags, assetModelSeftDiagnosiaAnswerValues) => {
    const assetModelSeftDiagnosia = await getAssetModelSeftDiagnosiaById(id);
    if (!assetModelSeftDiagnosia) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Asset not found');
    }
    Object.assign(assetModelSeftDiagnosia, _assetModelSeftDiagnosia);
    // xóa dữ liệu cũ
    await AssetModelSeftDiagnosiaTagModel.deleteMany({ assetModelSeftDiagnosia: id })
    await AssetModelSeftDiagnosiaAnswerValueModel.deleteMany({ assetModelSeftDiagnosia: id })
    if (tags && tags.length > 0) {
        tags.forEach(item => {
            item.assetModelSeftDiagnosia = assetModelSeftDiagnosia._id;
        });
        await AssetModelSeftDiagnosiaTagModel.insertMany(tags);
    }
    if (assetModelSeftDiagnosiaAnswerValues && assetModelSeftDiagnosiaAnswerValues.length > 0) {
        assetModelSeftDiagnosiaAnswerValues.forEach(item => {
            item.assetModelSeftDiagnosia = assetModelSeftDiagnosia._id;
        });
        await AssetModelSeftDiagnosiaAnswerValueModel.insertMany(assetModelSeftDiagnosiaAnswerValues);
    }
    await assetModelSeftDiagnosia.save();
    return assetModelSeftDiagnosia;
};
const deleteAssetModelSeftDiagnosiaById = async (id) => {
    const assetModelSeftDiagnosia = await getAssetModelSeftDiagnosiaById(id);
    if (!assetModelSeftDiagnosia) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Asset not found');
    }
    await AssetModelSeftDiagnosiaTagModel.deleteMany({ assetModelSeftDiagnosia: id })
    await AssetModelSeftDiagnosiaAnswerValueModel.deleteMany({ assetModelSeftDiagnosia: id })

    await assetModelSeftDiagnosia.remove();
    return assetModelSeftDiagnosia;
};

const getAllAssetModelSeftDiagnosia = async (filter) => {
    const assetModelSeftDiagnosias = await AssetModelSeftDiagnosiaModel.find(filter).populate([{
        path: 'assetModelFailureType'
    }]);
    return assetModelSeftDiagnosias;
};
const updateStatus = async (id) => {
    const assetModelSeftDiagnosia = await getAssetModelSeftDiagnosiaById(id);
    if (!assetModelSeftDiagnosia) {
        throw new ApiError(httpStatus.NOT_FOUND, 'assetModelSeftDiagnosia not found');
    }
    Object.assign(assetModelSeftDiagnosia, { status: !assetModelSeftDiagnosia });
    await assetModelSeftDiagnosia.save();
    return assetModelSeftDiagnosia;
};
const getTagsBySeftDIagnosiaId = async (seftDIagnosiaId) => {
    const tags = await AssetModelSeftDiagnosiaTagModel.find({ assetModelSeftDiagnosia: seftDIagnosiaId });
    return tags;
};
const getValuesBySeftDIagnosiaId = async (seftDIagnosiaId) => {
    const values = await AssetModelSeftDiagnosiaAnswerValueModel.find({ assetModelSeftDiagnosia: seftDIagnosiaId });
    return values;
};
const uploadExcel = async (filePath, file, req) => {
    let importData;
    try {
        const { uploadDir, filePath: _filePath, resourceImportData } = await prepareImportFile(file, "asset_model_seft_diagnosia");
        const importData = resourceImportData;

        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        const docs = [];
        const errors = [];
        const warnings = [];
        const duplicateInFileChecker = new Set();
        const relatedDataToInsert = [];

        const assetModelFailureTypesInFile = jsonData.map(r => r["Loại hỏng hóc"]);
        const existingAssetModelFailureTypes = await AssetModelFailureTypeModel.find({
            name: { $in: assetModelFailureTypesInFile }
        });
        const assetModelFailureTypeMap = new Map(existingAssetModelFailureTypes.map(
            c => [c.name, c]
        ));

        const assetModelFailureTypeIds = existingAssetModelFailureTypes.map(
            c => c._id
        );
        const existingAssetModelSeftDiagnosias = await AssetModelSeftDiagnosiaModel.find({
            assetModelFailureType: { $in: assetModelFailureTypeIds }
        });
        const existingMap = new Map(existingAssetModelSeftDiagnosias.map(m => [`${m.assetModelFailureType}-${m.question}-${m.answerType}`, true]));

        for (const row of jsonData) {
            const stt = row.STT;
            const assetModelFailureType = row["Loại hỏng hóc"] ? String(row["Loại hỏng hóc"]).trim() : "";
            const question = row["Câu hỏi"] ? String(row["Câu hỏi"]).trim() : "";
            const answerType = row["Loại câu trả lời"] ? String(row["Loại câu trả lời"]).trim() : "";
            const rawTags = row["Thẻ"] ? String(row["Thẻ"]).trim() : "";
            const rawAnswers = row["Câu trả lời"] ? String(row["Câu trả lời"]).trim() : "";

            if (!assetModelFailureType || !question || !answerType) {
                errors.push(
                    `❌ Lỗi ở dòng có STT là: ${stt}: Thiếu dữ liệu bắt buộc`
                )
                continue;
            }
            let assetMFT = assetModelFailureTypeMap.get(assetModelFailureType);
            if (!assetMFT) {
                assetMFT = await AssetModelFailureTypeModel.create({
                    name: assetModelFailureType,
                    assetModel: req.body.assetModel,
                    createdBy: req.user.id,
                    updatedBy: req.user.id,
                    // resourceImportData: resourceImportData._id,
                });
                assetModelFailureTypeMap.set(assetModelFailureType, assetMFT)
            }
            const assetMFTIdStr = assetMFT._id.toString();
            const normalizedAnswerType = answerType === "Phạm vi" ? "range" : "option";
            const fileKey = `${assetMFTIdStr}-${question.trim()}-${normalizedAnswerType}`;
            if (duplicateInFileChecker.has(fileKey)) {
                warnings.push(`⚠️ Dòng STT ${stt}: Loại hỏng hóc "${assetModelFailureType}" với câu hỏi "${question}" bị lặp lại trong file.`);
                continue;
            }
            duplicateInFileChecker.add(fileKey);
            if (existingMap.has(fileKey)) {
                warnings.push(`⚠️ Dòng STT ${stt}: Loại hỏng hóc "${assetModelFailureType}" với câu hỏi "${question}" đã tồn tại trong hệ thống.`);
                continue;
            }

            docs.push({
                assetModelFailureType: assetMFT._id,
                question,
                answerType: answerType === "Phạm vi" ? "range" : "option",
                assetModel: req.body.assetModel,
                createdBy: req.user.id,
                updatedBy: req.user.id,
                // resourceImportData: resourceImportData._id,
            });

            const tagsForThisDocs = rawTags ? rawTags.split(',').map((t, index) => ({
                name: t.trim(),
                sortIndex: index,
            })).filter(t => t.name) : [];

            const answersForThisDoc = [];
            if (rawAnswers) {
                const parts = rawAnswers.split('|');
                parts.forEach(p => {
                    let v1 = p.trim();
                    let v2 = null;
                    if (answerType === "Phạm vi") {
                        const rangeMatch = p.match(/\((.*?):(.*?)\)/)
                        if (rangeMatch) {
                            v1 = rangeMatch[1].trim();
                            v2 = rangeMatch[2].trim();
                        }
                    }
                    if (v1) {
                        answersForThisDoc.push({
                            value1: v1,
                            value2: v2,
                        })
                    }
                })
            }
            relatedDataToInsert.push({
                tags: tagsForThisDocs,
                answers: answersForThisDoc,
            });
        }

        if (errors.length > 0) {
            await rollbackImport(importData._id, filePath)
            return { success: false, errors };
        }
        if (docs.length > 0) {
            const insertedDocs = await AssetModelSeftDiagnosiaModel.insertMany(docs);
            const finalTags = [];
            const finalAnswers = [];

            insertedDocs.forEach((insertedDoc, index) => {
                const related = relatedDataToInsert[index];
                related.tags.forEach(t => {
                    t.assetModelSeftDiagnosia = insertedDoc._id;
                    finalTags.push(t);
                });
                related.answers.forEach(a => {
                    a.assetModelSeftDiagnosia = insertedDoc._id;
                    finalAnswers.push(a);
                })
            });
            if (finalTags.length > 0) await AssetModelSeftDiagnosiaTagModel.insertMany(finalTags);
            if (finalAnswers.length > 0) await AssetModelSeftDiagnosiaAnswerValueModel.insertMany(finalAnswers);
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
    queryAssetModelSeftDiagnosias,
    getAssetModelSeftDiagnosiaById,
    updateAssetModelSeftDiagnosiaById,
    deleteAssetModelSeftDiagnosiaById,
    createAssetModelSeftDiagnosia,
    getAllAssetModelSeftDiagnosia,
    getTagsBySeftDIagnosiaId,
    updateStatus,
    getValuesBySeftDIagnosiaId,
    uploadExcel,
};
