const httpStatus = require('http-status');
const { Branch } = require('../../models');
const ApiError = require('../../utils/ApiError');
const { prepareImportFile, rollbackImport } = require('./importData.service');
const XLSX = require('xlsx');
const fs = require('fs');

const createBranch = async (branch) => {
    const a = await Branch.create(branch);
    return a;
};

const queryBranches = async (filter, options) => {
    const a = await Branch.paginate(filter, options);
    return a;
};

const getBranchById = async (id) => {
    const a = await Branch.findById(id);
    return a;
};
const updateBranchById = async (id, branch) => {
    const a = await Branch.findByIdAndUpdate(id, branch);
    return a;
};
const deleteBranchById = async (id) => {
    const branch = await getBranchById(id);
    if (!branch) {
        throw new ApiError(httpStatus.NOT_FOUND, 'branch not found');
    }
    await branch.remove();
    return branch;
};

const updateStatus = async (id, updateBody) => {
    const branch = await getBranchById(id);
    if (!branch) {
        throw new ApiError(httpStatus.NOT_FOUND, 'branch not found');
    }
    Object.assign(branch, updateBody);
    await branch.save();
    return branch;
};

const getAllBranch = async () => {
    const branches = await Branch.find();
    return branches;
};

const uploadBranchExcel = async (filePath, file) => {
    let importData;
    try {
        const { uploadDir, filePath: _filePath, resourceImportData } = await prepareImportFile(file, 'branch');
        const importData = resourceImportData;

        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        const docs = [];
        const errors = [];
        const warnings = [];
        const duplicateInFileChecker = new Set();

        const namesInFile = jsonData.map((r) => r['Tên chi nhánh']);
        const existingBranchs = await Branch.find({
            name: { $in: namesInFile },
        });
        const existingMap = new Map(existingBranchs.map((m) => [m.name, true]));

        for (const row of jsonData) {
            const stt = row.STT;
            const name = row['Tên chi nhánh'] ? String(row['Tên chi nhánh']).trim() : '';
            if (!name) {
                errors.push(`❌ Lỗi ở dòng có STT là: ${stt}`);
                continue;
            }
            if (duplicateInFileChecker.has(name)) {
                warnings.push(`⚠️ Dòng STT ${stt}: Chi nhánh "${name}" bị lặp lại trong file.`);
                continue;
            }
            duplicateInFileChecker.add(name);
            if (existingMap.has(name)) {
                warnings.push(`⚠️ Dòng STT ${stt}: Chi nhánh "${name}" đã tồn tại trong hệ thống.`);
                continue;
            }

            docs.push({
                name,
                resourceImportData: resourceImportData._id,
            });
        }

        if (errors.length > 0) {
            await rollbackImport(importData._id, filePath);
            return { success: false, errors };
        }
        if (docs.length > 0) {
            await Branch.insertMany(docs);
        }
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        fs.renameSync(filePath, _filePath);
        return {
            success: true,
            insertCount: docs.length,
            warnings: warnings.length > 0 ? warnings : null,
        };
    } catch (error) {
        if (importData) {
            await rollbackImport(importData._id, filePath);
        }
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
    }
};
const getBranchNameById = async (id) => {
    const branch = await Branch.findById(id).select('name').lean();
    return branch?.name || null;
};
module.exports = {
    createBranch,
    queryBranches,
    getBranchById,
    updateBranchById,
    deleteBranchById,
    updateStatus,
    getAllBranch,
    uploadBranchExcel,
    getBranchNameById,
};
