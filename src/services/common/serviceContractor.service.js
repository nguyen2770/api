const httpStatus = require('http-status');
const { Types } = require('mongoose');
const { ServiceContractorModel, ServiceContractorUserMappingModel, User } = require('../../models');
const ApiError = require('../../utils/ApiError');
const { prepareImportFile, rollbackImport } = require('./importData.service');
const XLSX = require("xlsx");
const fs = require("fs");

const createServiceContractor = async (_serviceContractor) => {
    return ServiceContractorModel.create(_serviceContractor);
};


const queryServiceContractors = async (filter, options) => {
    const { searchText, ...otherFilters } = filter;
    let finalFilter = { ...otherFilters };
    if (searchText) {
        const searchRegex = new RegExp(searchText, 'i');
        finalFilter.$or = [
            { serviceContractorName: searchRegex },
            { contactPerson: searchRegex },
            { contactEmail: searchRegex },
            { contactPhoneNumber: searchRegex },
        ];
    }
    const serviceContractorCategories = await ServiceContractorModel.paginate(finalFilter, options);
    return serviceContractorCategories;
};

const getServiceContractorById = async (id) => {
    return ServiceContractorModel.findById(id);
};


const updateServiceContractorById = async (_id, updateBody) => {
    const serviceContractor = await getServiceContractorById(_id);
    if (!serviceContractor) {
        throw new ApiError(httpStatus.NOT_FOUND, 'serviceContractor not found');
    }

    Object.assign(serviceContractor, updateBody);
    await serviceContractor.save();
    return serviceContractor;
};
const deleteServiceContractorById = async (id) => {
    const serviceContractor = await getServiceContractorById(id);
    if (!serviceContractor) {
        throw new ApiError(httpStatus.NOT_FOUND, 'serviceContractor not found');
    }
    await serviceContractor.remove();
    return serviceContractor;
};


const getAllServiceContractors = async () => {
    return ServiceContractorModel.find();
};
const createServiceContractorUserMapping = async (_serviceContractorUserMapping) => {
    return ServiceContractorUserMappingModel.create(_serviceContractorUserMapping);
};
const updateServiceContractorUserMappingById = async (_id, updateBody) => {
    const serviceContractorUserMapping = await ServiceContractorUserMappingModel.findById(_id);
    if (!serviceContractorUserMapping) {
        throw new ApiError(httpStatus.NOT_FOUND, 'serviceContractor not found');
    }

    Object.assign(serviceContractorUserMapping, updateBody);
    await serviceContractorUserMapping.save();
    return serviceContractorUserMapping;
};
const deleteServiceContractorUserMappingById = async (id) => {
    const serviceContractorUserMapping = await ServiceContractorUserMappingModel.findById(id);
    if (!serviceContractorUserMapping) {
        throw new ApiError(httpStatus.NOT_FOUND, 'serviceContractorUserMapping not found');
    }
    await serviceContractorUserMapping.remove();
    return serviceContractorUserMapping;
};
const getServiceContractorUserMappingByRes = async (data) => {
    return ServiceContractorUserMappingModel.find(data).populate([{
        path: 'user'
    },
    {
        path: 'serviceContractor'
    }]);
};
const getListUserNotInServiceContractUserMapping = async (filter, options) => {
    // Nếu có truyền vào serviceContractor, lọc user chưa được ánh xạ
    if (filter.serviceContractor) {
        const serviceContractorUserMappings = await ServiceContractorUserMappingModel.find({
            serviceContractor: { $in: Array.isArray(filter.serviceContractor) ? filter.serviceContractor : [filter.serviceContractor] }
        }).select('user');
        const mappedUserIds = serviceContractorUserMappings.map(mapping => Types.ObjectId(mapping.user));
        // Thêm điều kiện loại trừ những user đã ánh xạ
        filter._id = { $nin: mappedUserIds };
        // Xoá key `serviceContractor` ra khỏi filter vì User không có field này
        delete filter.serviceContractor;
    }
    // Tìm những user KHÔNG nằm trong danh sách mappedUserIds
    const users = await User.paginate(filter, options);
    return users;
};

const uploadServiceContractorExcel = async (filePath, file) => {
    let importData;
    try {
        const { uploadDir, filePath: _filePath, resourceImportData } = await prepareImportFile(file, "service_contractor");
        const importData = resourceImportData;

        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        const docs = [];
        const errors = [];
        const warnings = [];
        const duplicateInFileChecker = new Set();

        const existingServiceContractors = await ServiceContractorModel.find({}, 'serviceContractorName contactPerson contactEmail address contactPhoneNumber');
        const createKey = (name, contactPerson, phone, email, address) =>
            `${String(name).trim()}|${String(contactPerson).trim()}|${String(phone).trim()}|${String(email).trim()}|${String(address).trim()}`;
        const existingMap = new Set(existingServiceContractors.map(s =>
            createKey(s.serviceContractorName, s.contactPerson, s.contactPhoneNumber, s.contactEmail, s.address)
        ));

        for (const row of jsonData) {
            const stt = row.STT;
            const serviceContractorName = row["Tên nhà thầu dịch vụ"] ? String(row["Tên nhà thầu dịch vụ"]).trim() : "";
            const contactPerson = row["Người liên hệ"] ? String(row["Người liên hệ"]).trim() : "";
            const contactEmail = row["Email"] ? String(row["Email"]).trim() : "";
            const contactPhoneNumber = row["Số điện thoại"] ? String(row["Số điện thoại"]).trim() : "";
            const address = row["Địa chỉ"] ? String(row["Địa chỉ"]).trim() : "";
            if (!serviceContractorName || !contactPerson || !contactEmail || !address || !contactPhoneNumber) {
                errors.push(
                    `❌ Lỗi ở dòng có STT là: ${stt}`
                )
                continue;
            }
            const rowKey = createKey(serviceContractorName, contactPerson, contactPhoneNumber, contactEmail, address);
            if (duplicateInFileChecker.has(rowKey)) {
                warnings.push(`⚠️ Dòng STT ${stt}: Nhà thầu dịch vụ "${serviceContractorName}" bị lặp lại trong file.`);
                continue;
            }
            duplicateInFileChecker.add(rowKey);

            if (existingMap.has(rowKey)) {
                warnings.push(`⚠️ Dòng STT ${stt}: Nhà thầu dịch vụ "${serviceContractorName}" với thông tin này đã tồn tại trên hệ thống.`);
                continue;
            }

            docs.push({
                serviceContractorName,
                contactPerson,
                contactEmail,
                contactPhoneNumber,
                address,
                resourceImportData: resourceImportData._id,
            });
        }

        if (errors.length > 0) {
            await rollbackImport(importData._id, filePath)
            return { success: false, errors };
        }
        if (docs.length > 0) {
            await ServiceContractorModel.insertMany(docs);
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
    queryServiceContractors,
    createServiceContractor,
    updateServiceContractorById,
    getServiceContractorById,
    deleteServiceContractorById,
    getAllServiceContractors,
    createServiceContractorUserMapping,
    updateServiceContractorUserMappingById,
    deleteServiceContractorUserMappingById,
    getServiceContractorUserMappingByRes,
    getListUserNotInServiceContractUserMapping,
    uploadServiceContractorExcel,
};
