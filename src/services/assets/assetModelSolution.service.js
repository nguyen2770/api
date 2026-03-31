const httpStatus = require('http-status');
const {
    AssetModelSolutionModel,
    AssetModelSolutionTagModel,
    AssetModelFailureTypeModel,
    Breakdown,
} = require('../../models');
const ApiError = require('../../utils/ApiError');
const { prepareImportFile, rollbackImport } = require('../common/importData.service');
const XLSX = require("xlsx");
const fs = require("fs");

const createAssetModelSolution = async (_assetModelSolution, tags) => {
    const assetModelSolution = await AssetModelSolutionModel.create(_assetModelSolution);
    //
    if (tags && tags.length > 0) {
        tags.forEach((item) => {
            item.assetModelSolution = assetModelSolution._id;
        });
        await AssetModelSolutionTagModel.insertMany(tags);
    }
    return assetModelSolution;
};
const createAssetModelSolutionByBreakdown = async (data, breakdownId) => {
    const breakdown = await Breakdown.findById(breakdownId).populate([{ path: 'assetMaintenance' }]);
    if (!breakdown || !breakdown?.assetMaintenance || !data.problem || data.problem === '') return;
    const problem = await AssetModelFailureTypeModel.findOneAndUpdate(
        { name: data.problem, assetModel: breakdown?.assetMaintenance?.assetModel },
        { $setOnInsert: { name: data.problem } },
        { upsert: true, new: true }
    );
    const assetModelSolutionModels = await AssetModelSolutionModel.countDocuments({
        assetModelFailureType: problem._id,
        solutionContent: data.solution,
        reasonOrigin: data.rootCause,
        assetModel: breakdown?.assetMaintenance?.assetModel,
    });
    data.assetModel = breakdown?.assetMaintenance?.assetModel;
    data.assetModelFailureType = problem?._id;
    data.solutionContent = data.solution;
    data.reasonOrigin = data.rootCause;
    if (assetModelSolutionModels === 0) return AssetModelSolutionModel.create(data);
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
const queryAssetModelSolutions = async (filter, options) => {
    const assets = await AssetModelSolutionModel.paginate(filter, options);
    return assets;
};

/**
 * Get user by id
 * @param {ObjectId} id
 * @returns {Promise<User>}
 */
const getAssetModelSolutionById = async (id) => {
    return AssetModelSolutionModel.findById(id);
};

const updateAssetModelSolutionById = async (id, _assetModelSolution, tags) => {
    const assetModelSolution = await getAssetModelSolutionById(id);
    if (!assetModelSolution) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Asset not found');
    }
    Object.assign(assetModelSolution, _assetModelSolution);
    // xóa dữ liệu cũ
    await AssetModelSolutionTagModel.deleteMany({ assetModelSolution: id });
    if (tags && tags.length > 0) {
        tags.forEach((item) => {
            item.assetModelSolution = assetModelSolution._id;
        });
        await AssetModelSolutionTagModel.insertMany(tags);
    }
    await assetModelSolution.save();
    return assetModelSolution;
};
const deleteAssetModelSolutionById = async (id) => {
    const assetModelSolution = await getAssetModelSolutionById(id);
    if (!assetModelSolution) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Asset not found');
    }
    await AssetModelSolutionTagModel.deleteMany({ assetModelSolution: id });

    await assetModelSolution.remove();
    return assetModelSolution;
};

const getAllAssetModelSolution = async (filter) => {
    const assetModelSolutions = await AssetModelSolutionModel.find(filter).populate([
        {
            path: 'assetModelFailureType',
        },
    ]);
    return assetModelSolutions;
};
const updateStatus = async (id) => {
    const assetModelSolution = await getAssetModelSolutionById(id);
    if (!assetModelSolution) {
        throw new ApiError(httpStatus.NOT_FOUND, 'assetModelSolution not found');
    }
    Object.assign(assetModelSolution, { status: !assetModelSolution });
    await assetModelSolution.save();
    return assetModelSolution;
};
const getTagsBySolutionId = async (SolutionId) => {
    const tags = await AssetModelSolutionTagModel.find({ assetModelSolution: SolutionId });
    return tags;
};
const uploadExcel = async (filePath, file, req) => {
    let importData;
    try {
        const { uploadDir, filePath: _filePath, resourceImportData } = await prepareImportFile(file, "asset_model_solution");
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
        const existingAssetModelSolutions = await AssetModelSolutionModel.find({
            assetModelFailureType: { $in: assetModelFailureTypeIds }
        });
        const existingMap = new Map(existingAssetModelSolutions.map(m => [`${m.assetModelFailureType}-${m.reasonOrigin}-${m.solutionContent}`, true]));

        for (const row of jsonData) {
            const stt = row.STT;
            const assetModelFailureType = row["Loại hỏng hóc"] ? String(row["Loại hỏng hóc"]).trim() : "";
            const rawTags = row["Thẻ"] ? String(row["Thẻ"]).trim() : "";
            const reasonOrigin = row["Nguyên nhân gốc"] ? String(row["Nguyên nhân gốc"]).trim() : "";
            const solutionContent = row["Giải pháp"] ? String(row["Giải pháp"]).trim() : "";
            if (!assetModelFailureType || !reasonOrigin || !solutionContent) {
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
                assetModelFailureTypeMap.set(assetModelFailureType, assetMFT);
            }
            const assetMFTIdStr = assetMFT._id.toString();
            const fileKey = `${assetMFTIdStr}-${reasonOrigin}-${solutionContent}`;
            if (duplicateInFileChecker.has(fileKey)) {
                warnings.push(`⚠️ Dòng STT ${stt}: Loại hỏng hóc "${assetModelFailureType}" với nguyên nhân "${reasonOrigin}", giải pháp "${solutionContent}" bị lặp lại trong file.`);
                continue;
            }
            duplicateInFileChecker.add(fileKey);
            if (existingMap.has(fileKey)) {
                warnings.push(`⚠️ Dòng STT ${stt}: Loại hỏng hóc "${assetModelFailureType}" với nguyên nhân "${reasonOrigin}", giải pháp "${solutionContent}" đã tồn tại trong hệ thống.`);
                continue;
            }

            docs.push({
                assetModelFailureType: assetMFT._id,
                reasonOrigin,
                solutionContent,
                assetModel: req.body.assetModel,
                createdBy: req.user.id,
                updatedBy: req.user.id,
                // resourceImportData: resourceImportData._id,
            });

            const tagsForThisDocs = rawTags ? rawTags.split(',').map((t, index) => ({
                name: t.trim(),
                sortIndex: index,
            })).filter(t => t.name) : [];

            relatedDataToInsert.push({
                tags: tagsForThisDocs,
            });
        }

        if (errors.length > 0) {
            await rollbackImport(importData._id, filePath)
            return { success: false, errors };
        }
        if (docs.length > 0) {
            const insertedDocs = await AssetModelSolutionModel.insertMany(docs);
            const finalTags = [];

            insertedDocs.forEach((insertedDoc, index) => {
                const related = relatedDataToInsert[index];
                related.tags.forEach(t => {
                    t.assetModelSolution = insertedDoc._id;
                    finalTags.push(t);
                });
            });
            if (finalTags.length > 0) await AssetModelSolutionTagModel.insertMany(finalTags);
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
};
module.exports = {
    queryAssetModelSolutions,
    getAssetModelSolutionById,
    updateAssetModelSolutionById,
    deleteAssetModelSolutionById,
    createAssetModelSolution,
    getAllAssetModelSolution,
    getTagsBySolutionId,
    updateStatus,
    createAssetModelSolutionByBreakdown,
    uploadExcel,
};
