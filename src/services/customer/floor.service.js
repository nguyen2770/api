const httpStatus = require('http-status');
const { Floor } = require('../../models');
const ApiError = require('../../utils/ApiError');
const { prepareImportFile, rollbackImport } = require('../common/importData.service');
const XLSX = require("xlsx");
const fs = require("fs");


const createFloor = async (floor) => {
    const a = await Floor.create(floor)
    return a;
}

const queryFloors = async (filter, options) => {
    const a = await Floor.paginate(filter, options);
    return a;
}

const getFloorById = async (id) => {
    const a = await Floor.findById(id)
    return a;
}
const updateFloorById = async (id, floor) => {
    const a = await Floor.findByIdAndUpdate(id, floor)
    return a;
}
const deleteFloorById = async (id) => {
    const floor = await getFloorById(id);
    if (!floor) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Floor not found');
    }
    await floor.remove();
    return floor;
}

const updateStatus = async (id, updateBody) => {
    const floor = await getFloorById(id);
    if (!floor) {
        throw new ApiError(httpStatus.NOT_FOUND, 'floor not found');
    }
    Object.assign(floor, updateBody);
    await floor.save();
    return floor;
};

const getAllFloor = async () => {
    const floors = await Floor.find();
    return floors;
}

const uploadFloorExcel = async (filePath, file) => {
    let importData;
    try {
        const { uploadDir, filePath: _filePath, resourceImportData } = await prepareImportFile(file, "floor");
        const importData = resourceImportData;

        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        const docs = [];
        const errors = [];
        const warnings = [];
        const duplicateInFileChecker = new Set();

        const floorNamesInFile = jsonData.map(r => r["Tên tầng"]);
        const existingFloors = await Floor.find({
            floorName: { $in: floorNamesInFile }
        });
        const existingMap = new Map(existingFloors.map(m => [m.floorName, true]));

        for (const row of jsonData) {
            const stt = row.STT;
            const floorName = row["Tên tầng"] ? String(row["Tên tầng"]).trim() : "";
            if (!floorName) {
                errors.push(
                    `❌ Lỗi ở dòng có STT là: ${stt}`
                )
                continue;
            }
            if (duplicateInFileChecker.has(floorName)) {
                warnings.push(`⚠️ Dòng STT ${stt}: Tầng "${floorName}" bị lặp lại trong file.`);
                continue;
            }
            duplicateInFileChecker.add(floorName);
            if (existingMap.has(floorName)) {
                warnings.push(`⚠️ Dòng STT ${stt}: Tầng "${floorName}" đã tồn tại trong hệ thống.`);
                continue;
            }

            docs.push({
                floorName,
                // resourceImportData: resourceImportData._id,
            });
        }

        if (errors.length > 0) {
            await rollbackImport(importData._id, filePath)
            return { success: false, errors };
        }
        if (docs.length > 0) {
            await Floor.insertMany(docs);
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
    createFloor,
    queryFloors,
    getFloorById,
    updateFloorById,
    deleteFloorById,
    updateStatus,
    getAllFloor,
    uploadFloorExcel,
}