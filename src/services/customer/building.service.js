const httpStatus = require('http-status');
const { Building } = require('../../models');
const ApiError = require('../../utils/ApiError');

const XLSX = require("xlsx");
const fs = require("fs");
const { prepareImportFile, rollbackImport } = require('../common/importData.service');

const createBuilding = async (building) => {
    const a = await Building.create(building)
    return a;
}

const queryBuildings = async (filter, options) => {
    const a = await Building.paginate(filter, options);
    return a;
}

const getBuildingById = async (id) => {
    const a = await Building.findById(id)
    return a;
}
const updateBuildingById = async (id, building) => {

    const a = await Building.findByIdAndUpdate(id, building)
    return a;
}
const deleteBuildingById = async (id) => {
    const building = await getBuildingById(id);
    if (!building) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Building not found');
    }
    await building.remove();
    return building;
}

const updateStatus = async (id, updateBody) => {
    const building = await getBuildingById(id);
    if (!building) {
        throw new ApiError(httpStatus.NOT_FOUND, 'building not found');
    }
    Object.assign(building, updateBody);
    await building.save();
    return building;
};

const getAllBuilding = async () => {
    const buildings = await Building.find();
    return buildings;
}

const uploadBuildingExcel = async (filePath, file) => {
    let importData;
    try {
        const { uploadDir, filePath: _filePath, resourceImportData } = await prepareImportFile(file, "building");
        const importData = resourceImportData;

        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        const docs = [];
        const errors = [];
        const warnings = [];
        const duplicateInFileChecker = new Set();

        const buildingNamesInFile = jsonData.map(r => r["Tên tòa nhà"]);
        const existingBuildings = await Building.find({
            buildingName: { $in: buildingNamesInFile }
        });
        const existingMap = new Map(existingBuildings.map(m => [m.buildingName, true]));

        for (const row of jsonData) {
            const stt = row.STT;
            const buildingName = row["Tên tòa nhà"] ? String(row["Tên tòa nhà"]).trim() : "";
            if (!buildingName) {
                errors.push(
                    `❌ Lỗi ở dòng có STT là: ${stt}`
                )
                continue;
            }
            if (duplicateInFileChecker.has(buildingName)) {
                warnings.push(`⚠️ Dòng STT ${stt}: Tòa nhà "${buildingName}" bị lặp lại trong file.`);
                continue;
            }
            duplicateInFileChecker.add(buildingName);
            if (existingMap.has(buildingName)) {
                warnings.push(`⚠️ Dòng STT ${stt}: Tòa nhà "${buildingName}" đã tồn tại trong hệ thống.`);
                continue;
            }

            docs.push({
                buildingName,
                // resourceImportData: resourceImportData._id,
            });
        }

        if (errors.length > 0) {
            await rollbackImport(importData._id, filePath)
            return { success: false, errors };
        }
        if (docs.length > 0) {
            await Building.insertMany(docs);
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
    createBuilding,
    queryBuildings,
    getBuildingById,
    updateBuildingById,
    deleteBuildingById,
    updateStatus,
    getAllBuilding,
    uploadBuildingExcel,
}