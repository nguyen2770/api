const httpStatus = require('http-status');
const { Supplier } = require('../../models');
const ApiError = require('../../utils/ApiError');
const { prepareImportFile, rollbackImport } = require('./importData.service');
const XLSX = require("xlsx");
const fs = require("fs");

const createSupplier = async (data) => {
    return Supplier.create(data);
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
const querySuppliers = async (filter, options) => {
    const { searchText, ...otherFilters } = filter;
    let finalFilter = { ...otherFilters };
    if (searchText) {
        const searchRegex = new RegExp(searchText, 'i');
        finalFilter.$or = [
            { supplierName: searchRegex },
            { phoneNumber: searchRegex },
            { email: searchRegex },
            { address: searchRegex },
        ];
    }
    const suppliers = await Supplier.paginate(finalFilter, options);
    return suppliers;
};

const getSupplierById = async (id) => {
    return Supplier.findById(id);
};

const updateSupplierById = async (supplierId, updateBody) => {
    const supplier = await getSupplierById(supplierId);
    if (!supplier) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Supplier not found');
    }

    Object.assign(supplier, updateBody);
    await supplier.save();
    return supplier;
};

const deleteSupplierById = async (supplierId) => {
    const supplier = await getSupplierById(supplierId);
    if (!supplier) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Supplier not found');
    }
    await supplier.remove();
    return supplier;
};

const updateStatus = async (id, updateBody) => {
    const supplier = await getSupplierById(id);
    if (!supplier) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Supplier not found');
    }
    Object.assign(supplier, updateBody);
    await supplier.save();
    return supplier;
};

const getAllSupplier = async () => {
    const suppliers = await Supplier.find();
    return suppliers;
};
const uploadSupplierExcel = async (filePath, file) => {
    let importData;
    try {
        const { uploadDir, filePath: _filePath, resourceImportData } = await prepareImportFile(file, "supplier");
        const importData = resourceImportData;

        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        const docs = [];
        const errors = [];
        const warnings = [];
        const duplicateInFileChecker = new Set();

        const existingSuppliers = await Supplier.find({}, 'supplierName phoneNumber email address');
        const createKey = (name, phone, email, address) =>
            `${String(name).trim()}|${String(phone).trim()}|${String(email).trim()}|${String(address).trim()}`;
        const existingMap = new Set(existingSuppliers.map(s =>
            createKey(s.supplierName, s.phoneNumber, s.email, s.address)
        ));

        for (const row of jsonData) {
            const stt = row.STT;
            const supplierName = row["Tên nhà cung cấp"] ? String(row["Tên nhà cung cấp"]).trim() : "";
            const phoneNumber = row["Số điện thoại"] ? String(row["Số điện thoại"]).trim() : "";
            const email = row["Email"] ? String(row["Email"]).trim() : "";
            const address = row["Địa chỉ"] ? String(row["Địa chỉ"]).trim() : "";
            if (!supplierName || !phoneNumber || !email || !address) {
                errors.push(
                    `❌ Lỗi ở dòng có STT là: ${stt}`
                )
                continue;
            }
            const rowKey = createKey(supplierName, phoneNumber, email, address);
            if (duplicateInFileChecker.has(rowKey)) {
                warnings.push(`⚠️ Dòng STT ${stt}: Nhà cung cấp "${supplierName}" bị lặp lại trong file.`);
                continue;
            }
            duplicateInFileChecker.add(rowKey);

            if (existingMap.has(rowKey)) {
                warnings.push(`⚠️ Dòng STT ${stt}: Nhà cung cấp "${supplierName}" với thông tin này đã tồn tại trên hệ thống.`);
                continue;
            }

            docs.push({
                supplierName,
                phoneNumber,
                email,
                address,
                resourceImportData: resourceImportData._id,
            });
        }

        if (errors.length > 0) {
            await rollbackImport(importData._id, filePath)
            return { success: false, errors };
        }
        if (docs.length > 0) {
            await Supplier.insertMany(docs);
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
    querySuppliers,
    getSupplierById,
    updateSupplierById,
    deleteSupplierById,
    createSupplier,
    updateStatus,
    getAllSupplier,
    uploadSupplierExcel,
};
