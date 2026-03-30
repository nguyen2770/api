const httpStatus = require('http-status');
const { SparePart, SparePartDetail, SpareCategoryModel, SpareSubCategoryModel, Uom, Manufacturer } = require('../../models');
const ApiError = require('../../utils/ApiError');
const XLSX = require("xlsx");
const fs = require("fs");
const { rollbackImport, prepareImportFile } = require('../common/importData.service');
const { periodMap } = require('../../utils/constant');

const createSparePart = async (sparePart) => {
    const createdSparePart = await SparePart.create(sparePart);
    return createdSparePart;
};

const querySpareParts = async (filter, options) => {
    const spareParts = await SparePart.paginate(filter, {
        ...options,
        populate: [
            { path: 'spareCategoryId', select: 'spareCategoryName' },
            { path: 'spareSubCategoryId', select: 'spareSubCategoryName' },
            { path: 'manufacturer', select: 'manufacturerName' },
            { path: 'uomId', select: 'uomName' },
        ],
    });
    return spareParts;
};

const getSparePartById = async (id) => {
    const sparePart = await SparePart.findById(id)
        .populate({ path: 'spareCategoryId', select: 'spareCategoryName' })
        .populate({ path: 'spareSubCategoryId', select: 'spareSubCategoryName' })
        .populate({ path: 'manufacturer', select: 'manufacturerName' })
        .populate({ path: 'uomId', select: 'uomName' });
    return sparePart;
};

const updateSparePartById = async (id, sparePartData) => {
    const updatedSparePart = await SparePart.findByIdAndUpdate(id, sparePartData, { new: true });
    return updatedSparePart;
};

const deleteSparePartById = async (id) => {
    const sparePart = await getSparePartById(id);
    if (!sparePart) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Spare part not found');
    }
    await sparePart.remove();
    return sparePart;
};

const getAllSpareParts = async () => {
    const spareParts = await SparePart.find().populate({ path: 'manufacturer' });
    return spareParts;
};

const updateSparePartStatus = async (id, status) => {
    const sparePart = await SparePart.findById(id);
    if (!sparePart) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Spare part not found');
    }
    sparePart.status = status;
    await sparePart.save();
    return sparePart;
};

const querySparePartDetails = async (filter, options) => {
    const sparePartDetails = await SparePartDetail.paginate(filter, {
        ...options,
        populate: [
            {
                path: "sparePart",
            },
        ],
    });

    return sparePartDetails;
};


const getSparePartDetailByQrCode = async (qrCode) => {
    const sparePartDetail = await SparePartDetail.findOne({ qrCode: qrCode })
        .populate({ path: "sparePart" })
        .populate({ path: "manufacturer" })
        .populate({ path: "supplier" })
        .populate({ path: "assetMaintenance" })

    return sparePartDetail;
}

const updateSparePartDetailByQrCode = async (qrCode, updateData) => {
    const updatedSparePartDetail = await SparePartDetail.findOneAndUpdate({ qrCode: qrCode }, updateData, { new: true });
    return updatedSparePartDetail;
}
const getSparePartByIdNotPopulate = async (id) => {
    const sparePart = await SparePart.findById(id);
    return sparePart;
};
const uploadExcel = async (filePath, file, req) => {
    let importData;
    try {
        const { uploadDir, filePath: _filePath, resourceImportData } = await prepareImportFile(file, "spare_parts");
        const importData = resourceImportData;

        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        const docs = [];
        const errors = [];
        const warnings = [];
        const duplicateInFileChecker = new Set();

        const spareCategoryNames = jsonData.map(r => r["Danh mục phụ tùng"]);
        const existingSpareCategories = await SpareCategoryModel.find({
            spareCategoryName: { $in: spareCategoryNames }
        });
        const categoryMap = new Map(existingSpareCategories.map(c => [c.spareCategoryName, c]));

        const spareSubCategoryNames = jsonData.map(r => r["Danh mục con"]);
        const existingSpareSubCategories = await SpareSubCategoryModel.find({
            spareSubCategoryName: { $in: spareSubCategoryNames }
        });
        const subCategoryMap = new Map(existingSpareSubCategories.map(c => [c.spareSubCategoryName, c]));

        const uomNames = jsonData.map(r => r["Đơn vị tính"]);
        const existingUom = await Uom.find({
            uomName: { $in: uomNames }
        });
        const uomMap = new Map(existingUom.map(c => [c.uomName, c]));

        const manufacturerNames = jsonData.map(r => String(r["Hãng sản xuất"] || "").trim()).filter(Boolean);
        const existingManufacturers = await Manufacturer.find({
            manufacturerName: { $in: manufacturerNames }
        });
        const manufacturerMap = new Map(existingManufacturers.map(c => [c.manufacturerName, c]));

        const sparePartNames = jsonData.map(r => r["Tên phụ tùng"]);
        const existingSpareParts = await SparePart.find({
            sparePartsName: { $in: sparePartNames }
        });

        const existingMapKey1_Key2 = new Map(existingSpareSubCategories.map(
            m => [`${m.spareSubCategoryName}-${m.spareCategory?.toString()}`, m]
        ));

        const existingMap = new Map(existingSpareParts.map(
            m => [`${m.sparePartsName}-${m.spareCategoryId}-${m.spareSubCategoryId}`
                + `-${m.uomId}-${m.code}-${m.manufacturer}`, true
            ]
        ));

        for (const row of jsonData) {
            const stt = row.STT;
            const spareCategory = row["Danh mục phụ tùng"] ? String(row["Danh mục phụ tùng"]).trim() : "";
            const spareSubCategory = row["Danh mục con"] ? String(row["Danh mục con"]).trim() : "";
            const sparePartsName = row["Tên phụ tùng"] ? String(row["Tên phụ tùng"]).trim() : "";
            const uom = row["Đơn vị tính"] ? String(row["Đơn vị tính"]).trim() : "";
            const code = row["Mã"] ? String(row["Mã"]).trim() : "";
            const manufacturer = row["Hãng sản xuất"] ? String(row["Hãng sản xuất"]).trim() : "";
            const description = row["Mô tả"] ? String(row["Mô tả"]).trim() : "";
            const lifeSpan = row["Thời gian sử dụng"] ? String(row["Thời gian sử dụng"]).trim() : "";
            const Period = row["Chu kỳ"] ? String(row["Chu kỳ"]).trim() : "";

            if (!spareCategory || !spareSubCategory || !sparePartsName || !uom || !code) {
                errors.push(
                    `❌ Lỗi ở dòng có STT là: ${stt}: Thiếu dữ liệu bắt buộc`
                )
                continue;
            }

            let key1 = categoryMap.get(spareCategory);
            if (!key1) {
                key1 = await SpareCategoryModel.create({
                    spareCategoryName: spareCategory,
                });
                categoryMap.set(spareCategory, key1);
            }
            const key1IdStr = key1._id.toString();

            const key1_key2 = `${spareSubCategory}-${key1IdStr}`;
            let key2 = existingMapKey1_Key2.get(key1_key2);
            if (!key2) {
                key2 = await SpareSubCategoryModel.create({
                    spareSubCategoryName: spareSubCategory,
                    spareCategory: key1._id,
                });
                existingMapKey1_Key2.set(key1_key2, key2);
            }
            const key2IdStr = key2._id.toString();

            let key3 = uomMap.get(uom);
            if (!key3) {
                key3 = await Uom.create({
                    uomName: uom,
                });
                uomMap.set(uom, key3);
            }
            const key3IdStr = key3._id.toString();

            let key4 = manufacturer ? manufacturerMap.get(manufacturer) : null;
            if (!key4 && manufacturer) {
                key4 = await Manufacturer.create({
                    manufacturerName: manufacturer,
                    resourceImportData: resourceImportData._id,
                });
                manufacturerMap.set(manufacturer, key4);
            }
            const key4IdStr = key4 ? key4._id : null;

            const fileKey = `${sparePartsName}-${key1IdStr}-${key2IdStr}-${key3IdStr}-${code}-${key4IdStr}`;
            if (duplicateInFileChecker.has(fileKey)) {
                warnings.push(`⚠️ Dòng STT ${stt}: Phụ tùng "${sparePartsName}" với thông tin trong hàng bị lặp lại trong file.`);
                continue;
            }
            duplicateInFileChecker.add(fileKey);
            if (existingMap.has(fileKey)) {
                warnings.push(`⚠️ Dòng STT ${stt}: Phụ tùng "${sparePartsName}" với thông tin trong hàng đã tồn tại trong hệ thống.`);
                continue;
            }

            docs.push({
                spareCategoryId: key1._id,
                spareSubCategoryId: key2._id,
                sparePartsName,
                uomId: key3._id,
                code,
                manufacturer: key4IdStr,
                description,
                lifeSpan,
                Period: periodMap[Period?.trim()] ?? null,
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
            await SparePart.insertMany(docs);
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
    createSparePart,
    querySpareParts,
    getSparePartById,
    updateSparePartById,
    deleteSparePartById,
    getAllSpareParts,
    updateSparePartStatus,
    querySparePartDetails,
    getSparePartDetailByQrCode,
    updateSparePartDetailByQrCode,
    getSparePartByIdNotPopulate,
    uploadExcel,
};
