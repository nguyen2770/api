const httpStatus = require('http-status');
const { Department } = require('../../models');
const ApiError = require('../../utils/ApiError');
const { prepareImportFile, rollbackImport } = require('../common/importData.service');
const XLSX = require('xlsx');
const fs = require('fs');

const createDepartment = async (department) => {
    const a = await Department.create(department);
    return a;
};

const queryDepartments = async (filter, options) => {
    const a = await Department.paginate(filter, options);
    return a;
};

const getDepartmentById = async (id) => {
    const a = await Department.findById(id);
    return a;
};
const updateDepartmentById = async (id, department) => {
    const a = await Department.findByIdAndUpdate(id, department);
    return a;
};
const deleteDepartmentById = async (id) => {
    const department = await getDepartmentById(id);
    if (!department) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Department not found');
    }
    await department.remove();
    return department;
};

const updateStatus = async (id, updateBody) => {
    const department = await getDepartmentById(id);
    if (!department) {
        throw new ApiError(httpStatus.NOT_FOUND, 'department not found');
    }
    Object.assign(department, updateBody);
    await department.save();
    return department;
};

const getAllDepartment = async () => {
    const departments = await Department.find();
    return departments;
};
const uploadDepartmentExcel = async (filePath, file) => {
    let importData;
    try {
        const { uploadDir, filePath: _filePath, resourceImportData } = await prepareImportFile(file, 'department');
        const importData = resourceImportData;

        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        const docs = [];
        const errors = [];
        const warnings = [];
        const duplicateInFileChecker = new Set();

        const departmentNamesInFile = jsonData.map((r) => r['Tên phòng ban']);
        const existingDepartments = await Department.find({
            departmentName: { $in: departmentNamesInFile },
        });
        const existingMap = new Map(existingDepartments.map((m) => [m.departmentName, true]));

        for (const row of jsonData) {
            const stt = row.STT;
            const departmentName = row['Tên phòng ban'] ? String(row['Tên phòng ban']).trim() : '';
            if (!departmentName) {
                errors.push(`❌ Lỗi ở dòng có STT là: ${stt}`);
                continue;
            }
            if (duplicateInFileChecker.has(departmentName)) {
                warnings.push(`⚠️ Dòng STT ${stt}: Phòng ban "${departmentName}" bị lặp lại trong file.`);
                continue;
            }
            duplicateInFileChecker.add(departmentName);
            if (existingMap.has(departmentName)) {
                warnings.push(`⚠️ Dòng STT ${stt}: Phòng ban "${departmentName}" đã tồn tại trong hệ thống.`);
                continue;
            }

            docs.push({
                departmentName,
                // resourceImportData: resourceImportData._id,
            });
        }

        if (errors.length > 0) {
            await rollbackImport(importData._id, filePath);
            return { success: false, errors };
        }
        if (docs.length > 0) {
            await Department.insertMany(docs);
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
const getDepartmentNameById = async (id) => {
    const department = await Department.findById(id).select('departmentName').lean();
    return department?.departmentName || null;
};
module.exports = {
    createDepartment,
    queryDepartments,
    getDepartmentById,
    updateDepartmentById,
    deleteDepartmentById,
    updateStatus,
    getAllDepartment,
    uploadDepartmentExcel,
    getDepartmentNameById,
};
