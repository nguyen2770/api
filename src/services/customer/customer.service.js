const httpStatus = require('http-status');
const { Customer } = require('../../models');
const ApiError = require('../../utils/ApiError');
const { prepareImportFile, rollbackImport } = require('../common/importData.service');
const XLSX = require("xlsx");
const fs = require("fs");

const createCustomer = async (customer) => Customer.create(customer);
const queryCustomers = async (filter, options) => {
    const { searchText, ...otherFilters } = filter;
    let finalFilter = { ...otherFilters };
    if (searchText) {
        const searchRegex = new RegExp(searchText, 'i');
        finalFilter.$or = [
            { customerName: searchRegex },
            { contactNumber: searchRegex },
            { contactEmail: searchRegex },
            { addressTwo: searchRegex },
        ];
    }
    return Customer.paginate
        ? Customer.paginate(finalFilter, options)
        : Customer.find(finalFilter);
}
const getCustomerById = async (id) => Customer.findById(id);
const updateCustomerById = async (id, updateBody) => {
    const customer = await getCustomerById(id);
    if (!customer) throw new ApiError(httpStatus.NOT_FOUND, 'Customer not found');
    Object.assign(customer, updateBody);
    await customer.save();
    return customer;
};
const updateStatus = async (id, updateBody) => {
    const group = await getCustomerById(id);
    if (!group) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Customer not found');
    }
    Object.assign(group, updateBody);
    await group.save();
    return group;
};
const deleteCustomerById = async (id) => {
    const customer = await getCustomerById(id);
    if (!customer) throw new ApiError(httpStatus.NOT_FOUND, 'Customer not found');
    await customer.remove();
    return customer;
};

const getAllCustomers = async () => {
    const customers = await Customer.find();
    return customers.map((c) => {
        const obj = c.toObject();
        obj.id = obj._id.toString();
        return obj;
    });
};

const insertManyCustomer = async (data) => {
    const customer = await Customer.insertMany(data, { ordered: false });
    return customer;
}

const uploadCustomerExcel = async (filePath, file) => {
    let importData;
    try {
        const { uploadDir, filePath: _filePath, resourceImportData } = await prepareImportFile(file, "customer");
        const importData = resourceImportData;

        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        const docs = [];
        const errors = [];
        const warnings = [];
        const duplicateInFileChecker = new Set();

        const existingSuppliers = await Customer.find({}, 'customerName contactEmail contactNumber address');
        const createKey = (name, email, phone, address) =>
            `${String(name).trim()}|${String(email).trim()}|${String(phone).trim()}|${String(address).trim()}`;
        const existingMap = new Set(existingSuppliers.map(s =>
            createKey(s.customerName, s.contactEmail, s.contactNumber, s.address)
        ));

        for (const row of jsonData) {
            const stt = row.STT;
            const customerName = row["Tên người dùng tài sản"] ? String(row["Tên người dùng tài sản"]).trim() : "";
            const contactNumber = row["Số điện thoại"] ? String(row["Số điện thoại"]).trim() : "";
            const contactEmail = row["Email"] ? String(row["Email"]).trim() : "";
            const address = row["Địa chỉ"] ? String(row["Địa chỉ"]).trim() : "";
            if (!customerName || !contactNumber || !contactEmail || !address) {
                errors.push(
                    `❌ Lỗi ở dòng có STT là: ${stt}`
                )
                continue;
            }
            const rowKey = createKey(customerName, contactEmail, contactNumber, address);
            if (duplicateInFileChecker.has(rowKey)) {
                warnings.push(`⚠️ Dòng STT ${stt}: Người dùng tài sản "${customerName}" bị lặp lại trong file.`);
                continue;
            }
            duplicateInFileChecker.add(rowKey);

            if (existingMap.has(rowKey)) {
                warnings.push(`⚠️ Dòng STT ${stt}: Người dùng tài sản "${customerName}" với thông tin này đã tồn tại trên hệ thống.`);
                continue;
            }

            docs.push({
                customerName,
                contactEmail,
                contactNumber,
                address,
                resourceImportData: resourceImportData._id,
            });
        }

        if (errors.length > 0) {
            await rollbackImport(importData._id, filePath)
            return { success: false, errors };
        }
        if (docs.length > 0) {
            await Customer.insertMany(docs);
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
    createCustomer,
    queryCustomers,
    getCustomerById,
    updateCustomerById,
    deleteCustomerById,
    getAllCustomers,
    updateStatus,
    insertManyCustomer,
    uploadCustomerExcel,
};
