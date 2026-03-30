const path = require('path');
const httpStatus = require('http-status');
const mongoose = require('mongoose');
const XLSX = require('xlsx');
const fs = require('fs');
const ApiError = require('../../utils/ApiError');
const {
    Manufacturer,
    Category,
    SubCategory,
    Asset,
    Supplier,
    AssetModel,
    AssetTypeCategoryModel,
    AssetMaintenance,
    Customer,
    ResourceImportDataModel,
    SpareCategoryModel,
    SpareSubCategoryModel,
    OriginModel,
    AssetModelChecklistModel,
    Department,
    ProvinceModel,
    Building,
    Floor,
    Branch,
    CommuneModel,
} = require('../../models');
const {
    assetTypeMap,
    yesNoMap,
    fundingSourcesTypeMap,
    assetStatusMap,
    createNewUsingAFormulaType,
} = require('../../utils/constant');
const resourceImportDataService = require('./resourceImportData.service');
const ResourceImportData = require('../../models/common/resourceImportData.model');
const sequenceService = require('./sequence.service');
// const excelDateToJSDate = (serial) => {
//     const utcDays = Math.floor(serial - 25569); // 25569 = 01/01/1970
//     const utcValue = utcDays * 86400;          // giây
//     return new Date(utcValue * 1000);
// }

// const uploadAssetMaintenanceExcel = async (filePath) => {
//     const session = await mongoose.startSession();
//     session.startTransaction();

//     // await AssetMaintenance.deleteMany({ assetNumber: { $in: [121, 120] } })
//     try {
//         const workbook = XLSX.readFile(filePath);
//         const sheet = workbook.Sheets[workbook.SheetNames[0]];
//         const jsonData = XLSX.utils.sheet_to_json(sheet);

//         const docs = [];

//         for (const row of jsonData) {
//             const stt = row.STT;
//             const manufacturerName = row["Hãng sản xuất"];
//             const categoryName = row["Danh mục"];
//             const subCategoryName = row["Danh mục con"];
//             const assetName = row["Tên tài sản"];
//             const supplierName = row["Nhà cung cấp"];
//             const assetModelName = row.Model;
//             const assetTypeCategoryName = row["Loại thiết bị"];
//             const assetStyle = assetTypeMap[row["Kiểu tài sản"]];
//             const customerName = row["Người sử dụng"];
//             const isMovable = yesNoMap[row["Thiết bị di động"]];
//             const description = row["Ghi chú"];
//             let installationDate = null;
//             if (row["Ngày cài đặt"]) {
//                 if (typeof row["Ngày cài đặt"] === "number") {
//                     // Excel serial number
//                     installationDate = excelDateToJSDate(row["Ngày cài đặt"]);
//                 } else {
//                     // Chuỗi "dd/MM/yyyy"
//                     const [day, month, year] = row["Ngày cài đặt"].split("/");
//                     installationDate = new Date(`${year}-${month}-${day}T00:00:00Z`);
//                 }
//             }

//             // const payload = {
//             //     manufacturerName,
//             //     categoryName,
//             //     subCategoryName,
//             //     assetName,
//             //     supplierName,
//             //     assetModelName,
//             //     assetTypeCategoryName,
//             //     assetStyle,
//             //     customerName,
//             //     serial: row["Số seri"] || null,
//             //     assetNumber: row["Số tài sản"] || null,
//             //     yearOfManufacturing: row["Năm sản xuất"] || null,
//             //     installationDate,
//             //     isMovable,
//             //     description,
//             // }
//             // console.log(payload)
//             // // helper inline luôn
//             const findOrCreate = async (Model, query, doc) => {
//                 let record = await Model.findOne(query);
//                 if (!record) {
//                     const created = await Model.create([doc]);
//                     record = created[0];
//                 }
//                 return record._id; // chỉ trả về _id
//             };

//             const assetTypeCategory = assetTypeCategoryName
//                 ? await findOrCreate(AssetTypeCategoryModel, { name: assetTypeCategoryName }, { name: assetTypeCategoryName })
//                 : null;

//             const manufacturer = manufacturerName
//                 ? await findOrCreate(Manufacturer, { manufacturerName }, { manufacturerName })
//                 : null;

//             const category = categoryName
//                 ? await findOrCreate(Category, { categoryName }, { categoryName })
//                 : null;

//             const subCategory = subCategoryName && category
//                 ? await findOrCreate(SubCategory, { subCategoryName, categoryId: category }, { subCategoryName, categoryId: category })
//                 : null;

//             const asset = assetName
//                 ? await findOrCreate(Asset, { assetName }, { assetName })
//                 : null;

//             const supplier = supplierName
//                 ? await findOrCreate(Supplier, { supplierName }, { supplierName })
//                 : null;
//             const customer = customerName
//                 ? await findOrCreate(Customer, { customerName }, { customerName })
//                 : null;

//             const assetModel = asset && assetModelName && category
//                 ? await findOrCreate(
//                     AssetModel,
//                     { assetModelName, asset, category, supplier, subCategory, manufacturer, assetTypeCategory },
//                     { assetModelName, asset, category, supplier, subCategory, manufacturer, assetTypeCategory }
//                 )
//                 : null;

//             if (assetModel && assetStyle) {
//                 docs.push({
//                     assetModel,
//                     asset,
//                     assetStyle,
//                     serial: row["Số seri"] || null,
//                     assetNumber: row["Số tài sản"] || null,
//                     yearOfManufacturing: row["Năm sản xuất"] || null,
//                     installationDate,
//                     customer,
//                     isMovable,
//                     description,
//                 });
//             } else {
//                 console.log("❌ Bỏ qua dòng do thiếu dữ liệu dòng :", stt);
//                 return;
//             }
//         }

//         if (docs.length > 0) {
//             await AssetMaintenance.insertMany(docs);
//         }

//         await session.commitTransaction();
//         session.endSession();
//         return { success: true };
//     } catch (error) {
//         await session.abortTransaction();
//         session.endSession();
//         throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
//     }
// };
const excelDateToJSDate = (serial) => {
    const utcDays = Math.floor(serial - 25569); // 25569 = 01/01/1970
    const utcValue = utcDays * 86400; // giây
    return new Date(utcValue * 1000);
};
const escapeRegex = (text) => {
    if (text === null || text === undefined) return '';
    return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const uploadAssetMaintenanceExcel = async (filePath, file, company, companySetting) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    const uploadDir = path.join(__dirname, '../../../uploads');
    const fileName = path.parse(file.originalname).name; // Tên file gốc
    const extension = path.extname(file.originalname); // Đuôi file gốc
    const fileNameExtension = fileName + extension;
    const _filePath = path.join(uploadDir, fileNameExtension); // Đường dẫn trong server
    const fileType = file.mimetype;
    let resourceImportData = null;
    try {
        resourceImportData = await resourceImportDataService.createResourceImportData(
            {
                fileName,
                filePath: _filePath,
                extension,
                fileType,
                createdDate: new Date(),
                sourceSave: 'ASSETMAINTENANCE',
            }
            // , { session }
        );
        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        // await AssetMaintenance.deleteMany({ description: { $in: ['12', '21F2K1E2:P3E2:P3DA2:P3'] } })
        const docs = [];
        for (const row of jsonData) {
            const manufacturerName = row['Hãng sản xuất'];
            const categoryName = row['Danh mục'];
            const assetName = row['Tên tài sản'];
            const supplierName = row['Nhà cung cấp'];
            const customerName = row['Người sử dụng'];
            const nameAssetTypeCategory = row['Loại thiết bị'];
            const subCategoryName = row['Danh mục con'];
            const stt = row.STT;
            const assetModelName = row.Model;
            const assetStyle = assetTypeMap[row['Kiểu tài sản']];
            const fundingSources = fundingSourcesTypeMap[row['Nguồn kinh phí mua máy']];
            const assetStatus = assetStatusMap[row['Trạng thái tài sản']];
            const serial = row['Số seri'];
            const symbol = row['Ký hiệu (mã nhóm máy )'];
            const assetNumberByFile = row['Mã tài sản'];
            const originName = row['Xuất xứ'];
            const registrationNumber = row['Số lưu hành'];
            const departmentName = row['Phòng ban'];
            const provinceName = row['Tỉnh thành phố'];
            const floorName = row['Tầng'];
            const buildingName = row['Tòa nhà'];
            const branchName = row['Khu vực'];
            const communeName = row['Phường/Xã'];
            const addressNote = row['Địa chỉ'];
            const purchaseValue = row['Giá trị'];
            const purchaseNumber = row['Mã đơn mua hàng'];
            const serviceProviderName = row['Tên cung cấp dịch vụ'];
            const capacityRating = row['Công suất định mức'];
            const criticality = row['Mức độ thiết yếu'];

            let manufacturer = null;
            if (manufacturerName) {
                let originId = null;
                if (originName) {
                    const origin = await OriginModel.findOneAndUpdate(
                        { originName: new RegExp(`^${escapeRegex(originName)}$`, 'i') },
                        { $setOnInsert: { originName: originName, resourceImportData: resourceImportData._id } },
                        { new: true, upsert: true }
                    );
                    originId = origin._id;
                }
                const data = await Manufacturer.findOneAndUpdate(
                    { manufacturerName: new RegExp(`^${escapeRegex(manufacturerName)}$`, 'i') },
                    {
                        $setOnInsert: {
                            manufacturerName: manufacturerName,
                            resourceImportData: resourceImportData._id,
                            origin: originId,
                        },
                    },
                    { new: true, upsert: true }
                );
                manufacturer = data._id;
            }

            let category = null;
            if (categoryName) {
                const data = await Category.findOneAndUpdate(
                    { categoryName: new RegExp(`^${escapeRegex(categoryName)}$`, 'i') },
                    { $setOnInsert: { resourceImportData: resourceImportData._id, categoryName } },
                    { new: true, upsert: true }
                );
                category = data._id;
            }

            let asset = null;
            if (assetName) {
                // if (
                //     companySetting.autoGenerateAssetNumber &&
                //     companySetting.createNewUsingAFormula === createNewUsingAFormulaType.healthInsurance
                // ) {
                //     if (!symbol) {
                //         throw new ApiError(
                //             httpStatus.BAD_REQUEST,
                //             `❌ Lỗi ở dòng thứ ${stt}, Ký hiệu (mã nhóm máy ) không được để trống`
                //         );
                //     }
                // }
                if (symbol) {
                    const data = await Asset.findOneAndUpdate(
                        { assetName: new RegExp(`^${escapeRegex(assetName)}$`, 'i'), symbol },
                        { $setOnInsert: { resourceImportData: resourceImportData._id, assetName, symbol } },
                        { new: true, upsert: true }
                    );
                    asset = data._id;
                } else {
                    const data = await Asset.findOneAndUpdate(
                        { assetName: new RegExp(`^${escapeRegex(assetName)}$`, 'i') },
                        { $setOnInsert: { resourceImportData: resourceImportData._id, assetName } },
                        { new: true, upsert: true }
                    );
                    asset = data._id;
                }
            }

            let supplier = null;
            if (supplierName) {
                const data = await Supplier.findOneAndUpdate(
                    { supplierName: new RegExp(`^${escapeRegex(supplierName)}$`, 'i') },
                    { $setOnInsert: { resourceImportData: resourceImportData._id, supplierName } },
                    { new: true, upsert: true }
                );
                supplier = data._id;
            }

            let customer = null;
            if (customerName) {
                const data = await Customer.findOneAndUpdate(
                    { customerName: new RegExp(`^${escapeRegex(customerName)}$`, 'i') },
                    { $setOnInsert: { resourceImportData: resourceImportData._id, customerName } },
                    { new: true, upsert: true }
                );
                customer = data._id;
            }

            let assetTypeCategory = null;
            if (nameAssetTypeCategory) {
                const data = await AssetTypeCategoryModel.findOneAndUpdate(
                    { name: new RegExp(`^${escapeRegex(nameAssetTypeCategory)}$`, 'i') },
                    { $setOnInsert: { resourceImportData: resourceImportData._id, name: nameAssetTypeCategory } },
                    { new: true, upsert: true }
                );
                assetTypeCategory = data._id;
            }

            let subCategory = null;
            if (subCategoryName && category) {
                const data = await SubCategory.findOneAndUpdate(
                    { subCategoryName: new RegExp(`^${escapeRegex(subCategoryName)}$`, 'i'), categoryId: category },
                    {
                        $setOnInsert: {
                            resourceImportData: resourceImportData._id,
                            subCategoryName,
                            categoryId: category,
                        },
                    },
                    { new: true, upsert: true }
                );
                subCategory = data._id;
            }

            let assetModel = null;
            if (assetModelName && asset && category) {
                const data = await AssetModel.findOneAndUpdate(
                    {
                        assetModelName: new RegExp(`^${escapeRegex(assetModelName)}$`, 'i'),
                        category,
                        asset,
                        supplier,
                        subCategory,
                        manufacturer,
                        assetTypeCategory,
                    },
                    {
                        $setOnInsert: {
                            assetModelName,
                            category,
                            asset,
                            supplier,
                            subCategory,
                            manufacturer,
                            assetTypeCategory,
                            resourceImportData: resourceImportData._id,
                        },
                    },
                    { new: true, upsert: true }
                );
                assetModel = data._id;
            }
            // Vị trí
            let department = null;
            if (departmentName) {
                const data = await Department.findOneAndUpdate(
                    { departmentName: new RegExp(`^${escapeRegex(departmentName)}$`, 'i') },
                    { $setOnInsert: { resourceImportData: resourceImportData._id, departmentName: departmentName } },
                    { new: true, upsert: true }
                );
                department = data._id;
            }
            let province = null;
            if (provinceName) {
                const data = await ProvinceModel.findOneAndUpdate(
                    { name: new RegExp(`^${escapeRegex(provinceName)}$`, 'i') },
                    { $setOnInsert: { resourceImportData: resourceImportData._id, name: provinceName } },
                    { new: true, upsert: true }
                );
                province = data._id;
            }
            let building = null;
            if (buildingName) {
                const data = await Building.findOneAndUpdate(
                    { buildingName: new RegExp(`^${escapeRegex(buildingName)}$`, 'i') },
                    { $setOnInsert: { resourceImportData: resourceImportData._id, buildingName: buildingName } },
                    { new: true, upsert: true }
                );
                building = data._id;
            }
            let floor = null;
            if (floorName) {
                const data = await Floor.findOneAndUpdate(
                    { floorName: new RegExp(`^${escapeRegex(floorName)}$`, 'i') },
                    { $setOnInsert: { resourceImportData: resourceImportData._id, floorName: floorName } },
                    { new: true, upsert: true }
                );
                floor = data._id;
            }
            let branch = null;
            if (branchName) {
                const data = await Branch.findOneAndUpdate(
                    { name: new RegExp(`^${escapeRegex(branchName)}$`, 'i') },
                    { $setOnInsert: { resourceImportData: resourceImportData._id, name: branchName } },
                    { new: true, upsert: true }
                );
                branch = data._id;
            }
            let commune = null;
            if (communeName && province) {
                const data = await CommuneModel.findOneAndUpdate(
                    { name: new RegExp(`^${escapeRegex(communeName)}$`, 'i'), province },
                    { $setOnInsert: { resourceImportData: resourceImportData._id, name: communeName, province } },
                    { new: true, upsert: true }
                );
                commune = data._id;
            }
            // ==== 3. Build docs ====
            let installationDate = null;
            if (row['Ngày cài đặt']) {
                if (typeof row['Ngày cài đặt'] === 'number') {
                    installationDate = excelDateToJSDate(row['Ngày cài đặt']);
                } else {
                    const [day, month, year] = row['Ngày cài đặt'].split('/');
                    installationDate = new Date(`${year}-${month}-${day}T00:00:00Z`);
                }
            }
            let purchaseDate = null;
            if (row['Ngày mua']) {
                if (typeof row['Ngày mua'] === 'number') {
                    purchaseDate = excelDateToJSDate(row['Ngày mua']);
                } else {
                    const [day, month, year] = row['Ngày mua'].split('/');
                    purchaseDate = new Date(`${year}-${month}-${day}T00:00:00Z`);
                }
            }
            let currentAssetNumber = null;
            // không check ngày cài đặt bắt buộc nhập trên này
            if (asset && assetModel && assetStyle) {
                if (
                    companySetting.autoGenerateAssetNumber &&
                    companySetting?.createNewUsingAFormula === createNewUsingAFormulaType.healthInsurance &&
                    symbol &&
                    fundingSources
                ) {
                    currentAssetNumber = await sequenceService.generateCurrentAssetNumber(
                        company,
                        asset,
                        serial,
                        fundingSources
                    );
                    const assetMaintenanceService = require('./assetMaintenance.service');
                    const result = await assetMaintenanceService.checkForDuplicates(
                        company,
                        asset,
                        fundingSources,
                        currentAssetNumber,
                        serial
                    );
                    if (result.isDuplicate) {
                        throw new ApiError(httpStatus.BAD_REQUEST, `❌ Lỗi ở dòng thứ ${stt}, đã tồn tại mã tài sản này`);
                    }
                    if (!serial) {
                        await sequenceService.saveCurrentAssetNumber(company);
                    }
                } else {
                    if (assetNumberByFile) {
                        currentAssetNumber = assetNumberByFile;
                    } else {
                        currentAssetNumber = await sequenceService.generateSequenceCode('ASSET_NUMBER');
                    }
                }
            } else {
                throw new ApiError(httpStatus.BAD_REQUEST, `❌ Lỗi ở dòng thứ ${stt}`);
            }
            docs.push({
                assetModel,
                asset,
                assetStyle,
                serial: serial || null,
                assetNumber: currentAssetNumber || null,
                yearOfManufacturing: row['Năm sản xuất'] || null,
                installationDate,
                customer,
                isMovable: yesNoMap[row['Thiết bị di động']] || null,
                description: row['Ghi chú'],
                resourceImportData: resourceImportData._id,
                assetModelName,
                subCategoryName,
                customerName,
                assetName,
                categoryName,
                manufacturerName,
                fundingSources,
                assetStatus,
                registrationNumber: registrationNumber || null,
                department: department,
                criticality,
                capacityRating,
                serviceProviderName,
                purchaseNumber,
                purchaseValue,
                purchaseDate,
                addressNote,
                commune,
                branch,
                floor,
                building,
                province,
            });
        }
        // ==== 4. Insert 1 lần ====
        if (docs.length > 0) {
            await AssetMaintenance.insertMany(docs);
        }
        // await session.abortTransaction();
        await session.commitTransaction();
        session.endSession();
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        fs.copyFileSync(filePath, _filePath);
        return { success: true };
    } catch (error) {
        await session.abortTransaction();
        // ❌ XÓA FILE ĐÃ UPLOAD
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        // ❌ XÓA FILE ĐÃ COPY VÀO UPLOADS
        if (fs.existsSync(_filePath)) {
            fs.unlinkSync(_filePath);
        }
        // xóa đi các bảng phụ nếu có dữ liệu lỗi
        // await Supplier.deleteMany({
        //     resourceImportData: { $exists: true, $ne: null },
        // });
        // await Manufacturer.deleteMany({ resourceImportData: { $exists: true, $ne: null } });
        // await OriginModel.deleteMany({ resourceImportData: { $exists: true, $ne: null } });
        // await Category.deleteMany({ resourceImportData: { $exists: true, $ne: null } });
        // await SubCategory.deleteMany({ resourceImportData: { $exists: true, $ne: null } });
        // await AssetTypeCategoryModel.deleteMany({ resourceImportData: { $exists: true, $ne: null } });
        // await Asset.deleteMany({ resourceImportData: { $exists: true, $ne: null } });
        // await AssetModel.deleteMany({ resourceImportData: { $exists: true, $ne: null } });
        // await Customer.deleteMany({ resourceImportData: { $exists: true, $ne: null } });
        await Supplier.deleteMany({ resourceImportData: resourceImportData?._id });
        await Manufacturer.deleteMany({ resourceImportData: resourceImportData?._id });
        await OriginModel.deleteMany({ resourceImportData: resourceImportData?._id });
        await Category.deleteMany({ resourceImportData: resourceImportData?._id });
        await SubCategory.deleteMany({ resourceImportData: resourceImportData?._id });
        await AssetTypeCategoryModel.deleteMany({ resourceImportData: resourceImportData?._id });
        await Asset.deleteMany({ resourceImportData: resourceImportData?._id });
        await AssetModel.deleteMany({ resourceImportData: resourceImportData?._id });
        await Customer.deleteMany({ resourceImportData: resourceImportData?._id });
        await Department.deleteMany({ resourceImportData: resourceImportData?._id });
        await ProvinceModel.deleteMany({ resourceImportData: resourceImportData?._id });
        await Building.deleteMany({ resourceImportData: resourceImportData?._id });
        await Floor.deleteMany({ resourceImportData: resourceImportData?._id });
        await Branch.deleteMany({ resourceImportData: resourceImportData?._id });
        await CommuneModel.deleteMany({ resourceImportData: resourceImportData?._id });
        await ResourceImportDataModel.findByIdAndDelete(resourceImportData?._id);
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
    }
};

const generateFileCode = () => {
    const now = new Date();
    const date =
        now.getFullYear().toString() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0');
    const time =
        String(now.getHours()).padStart(2, '0') +
        String(now.getMinutes()).padStart(2, '0') +
        String(now.getSeconds()).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${date}_${time}_${random}`;
};

const prepareImportFile = async (file, prefixName) => {
    const uploadDir = path.join(__dirname, '../../../uploads');
    const extension = path.extname(file.originalname);
    const fileCode = generateFileCode();

    const fileNameExtension = `${prefixName}_${fileCode}${extension}`;
    const filePath = path.join(uploadDir, fileNameExtension);

    const resourceImportData = await resourceImportDataService.createResourceImportData({
        fileName: `${prefixName}_${fileCode}`,
        filePath,
        extension,
        fileType: file.mimetype,
        createdDate: new Date(),
        sourceSave: prefixName.toUpperCase(),
    });

    return {
        uploadDir,
        filePath,
        resourceImportData,
    };
};

const rollbackImport = async (importId, tempFilePath) => {
    if (importId) {
        await ResourceImportData.findByIdAndDelete(importId);
    }
    if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
    }
};

const uploadCategoryExcel = async (filePath, file) => {
    let importData;
    try {
        const { uploadDir, filePath: _filePath, resourceImportData } = await prepareImportFile(file, 'category');
        const importData = resourceImportData;

        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        const docs = [];
        const errors = [];
        const warnings = [];
        const duplicateInFileChecker = new Set();

        const categoryNamesInFile = jsonData.map((r) => r['Danh mục phụ tùng']);
        const existingCategories = await Category.find({
            categoryName: { $in: categoryNamesInFile },
        });
        const existingMap = new Map(existingCategories.map((m) => [m.CategoryName, true]));

        for (const row of jsonData) {
            const stt = row.STT;
            const categoryName = row['Danh mục chính'] ? String(row['Danh mục chính']).trim() : '';
            if (!categoryName) {
                errors.push(`❌ Lỗi ở dòng có STT là: ${stt}`);
                continue;
            }
            if (duplicateInFileChecker.has(categoryName)) {
                warnings.push(`⚠️ Dòng STT ${stt}: Danh mục chính "${categoryName}" bị lặp lại trong file.`);
                continue;
            }
            duplicateInFileChecker.add(categoryName);
            if (existingMap.has(categoryName)) {
                warnings.push(`⚠️ Dòng STT ${stt}: Danh mục chính "${categoryName}" đã tồn tại trong hệ thống.`);
                continue;
            }

            docs.push({
                categoryName,
                resourceImportData: resourceImportData._id,
            });
        }

        if (errors.length > 0) {
            await rollbackImport(importData._id, filePath);
            return { success: false, errors };
        }
        if (docs.length > 0) {
            await Category.insertMany(docs);
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

const uploadSubCategoryExcel = async (filePath, file) => {
    let importData;
    try {
        const { uploadDir, filePath: _filePath, resourceImportData } = await prepareImportFile(file, 'sub_category');
        const importData = resourceImportData;

        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        const docs = [];
        const errors = [];
        const warnings = [];
        const duplicateInFileChecker = new Set();

        const categoryNames = [...new Set(jsonData.map((r) => r['Danh mục chính']))];
        const existingCategories = await Category.find({ categoryName: { $in: categoryNames } });
        const categoryMap = new Map(existingCategories.map((c) => [c.categoryName, c]));

        const subCategoryNamesInFile = jsonData.map((r) => String(r['Danh mục phụ tùng con'] || '').trim()).filter(Boolean);
        const existingSubCategorys = await SubCategory.find({
            subCategoryName: { $in: subCategoryNamesInFile },
        });
        const existingMap = new Map(
            existingSubCategorys.map((m) => [`${m.subCategoryName}-${m.categoryId?.toString()}`, true])
        );

        for (const row of jsonData) {
            const stt = row.STT;
            const categoryName = row['Danh mục chính'] ? String(row['Danh mục chính']).trim() : '';
            const subCategoryName = row['Danh mục phụ'] ? String(row['Danh mục phụ']).trim() : '';
            if (!categoryName || !subCategoryName) {
                errors.push(`❌ Lỗi ở dòng có STT là: ${stt}`);
                continue;
            }
            let category = categoryMap.get(categoryName);
            if (!category) {
                category = await Category.create({
                    categoryName,
                    resourceImportData: resourceImportData._id,
                });
                categoryMap.set(categoryName, category);
            }
            const categoryIdStr = category._id.toString();
            const fileKey = `${subCategoryName}-${categoryIdStr}`;
            if (duplicateInFileChecker.has(fileKey)) {
                warnings.push(
                    `⚠️ Dòng STT ${stt}: Danh mục phụ "${subCategoryName}" thuộc danh mục chính "${categoryName}" bị lặp lại trong file.`
                );
                continue;
            }
            duplicateInFileChecker.add(fileKey);
            if (existingMap.has(fileKey)) {
                warnings.push(
                    `⚠️ Dòng STT ${stt}: Danh mục phụ "${subCategoryName}" thuộc danh mục chính "${categoryName}" đã tồn tại trong hệ thống.`
                );
                continue;
            }

            docs.push({
                categoryId: category._id,
                subCategoryName,
                resourceImportData: resourceImportData._id,
            });
        }

        if (errors.length > 0) {
            await rollbackImport(importData._id, filePath);
            return { success: false, errors };
        }
        if (docs.length > 0) {
            await SubCategory.insertMany(docs);
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

const uploadAssetExcel = async (filePath, file) => {
    let importData;
    try {
        const { uploadDir, filePath: _filePath, resourceImportData } = await prepareImportFile(file, 'asset');
        const importData = resourceImportData;

        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        const docs = [];
        const errors = [];
        const warnings = [];
        const duplicateInFileChecker = new Set();

        const assetNamesInFile = jsonData.map((r) => r['Tên thiết bị']);
        const existingAssets = await Asset.find({
            assetName: { $in: assetNamesInFile },
        });
        const existingMap = new Map(existingAssets.map((m) => [m.assetName, true]));

        for (const row of jsonData) {
            const stt = row.STT;
            const assetName = row['Tên thiết bị'] ? String(row['Tên thiết bị']).trim() : '';
            if (!assetName) {
                errors.push(`❌ Lỗi ở dòng có STT là: ${stt}`);
                continue;
            }
            if (duplicateInFileChecker.has(assetName)) {
                warnings.push(`⚠️ Dòng STT ${stt}: Thiết bị "${assetName}" bị lặp lại trong file.`);
                continue;
            }
            duplicateInFileChecker.add(assetName);
            if (existingMap.has(assetName)) {
                warnings.push(`⚠️ Dòng STT ${stt}: Thiết bị "${assetName}" đã tồn tại trong hệ thống.`);
                continue;
            }

            docs.push({
                assetName,
                resourceImportData: resourceImportData._id,
            });
        }

        if (errors.length > 0) {
            await rollbackImport(importData._id, filePath);
            return { success: false, errors };
        }
        if (docs.length > 0) {
            await Asset.insertMany(docs);
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

const uploadSpareCategoryExcel = async (filePath, file) => {
    let importData;
    try {
        const { uploadDir, filePath: _filePath, resourceImportData } = await prepareImportFile(file, 'spare_category');
        const importData = resourceImportData;

        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        const docs = [];
        const errors = [];
        const warnings = [];
        const duplicateInFileChecker = new Set();

        const spareCategoryNamesInFile = jsonData.map((r) => r['Danh mục phụ tùng']);
        const existingSpareCategories = await SpareCategoryModel.find({
            spareCategoryName: { $in: spareCategoryNamesInFile },
        });
        const existingMap = new Map(existingSpareCategories.map((m) => [m.spareCategoryName, true]));

        for (const row of jsonData) {
            const stt = row.STT;
            const spareCategoryName = row['Danh mục phụ tùng'] ? String(row['Danh mục phụ tùng']).trim() : '';
            if (!spareCategoryName) {
                errors.push(`❌ Lỗi ở dòng có STT là: ${stt}`);
                continue;
            }
            if (duplicateInFileChecker.has(spareCategoryName)) {
                warnings.push(`⚠️ Dòng STT ${stt}: Danh mục phụ tùng "${spareCategoryName}" bị lặp lại trong file.`);
                continue;
            }
            duplicateInFileChecker.add(spareCategoryName);
            if (existingMap.has(spareCategoryName)) {
                warnings.push(`⚠️ Dòng STT ${stt}: Danh mục phụ tùng "${spareCategoryName}" đã tồn tại trong hệ thống.`);
                continue;
            }

            docs.push({
                spareCategoryName,
                resourceImportData: resourceImportData._id,
            });
        }

        if (errors.length > 0) {
            await rollbackImport(importData._id, filePath);
            return { success: false, errors };
        }
        if (docs.length > 0) {
            await SpareCategoryModel.insertMany(docs);
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

const uploadSpareSubCategoryExcel = async (filePath, file) => {
    let importData;
    try {
        const { uploadDir, filePath: _filePath, resourceImportData } = await prepareImportFile(file, 'spare_sub_category');
        const importData = resourceImportData;

        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        const docs = [];
        const errors = [];
        const warnings = [];
        const duplicateInFileChecker = new Set();

        const spareCategoryNames = [...new Set(jsonData.map((r) => r['Danh mục phụ tùng']))];
        const existingCategories = await SpareCategoryModel.find({ spareCategoryName: { $in: spareCategoryNames } });
        const categoryMap = new Map(existingCategories.map((c) => [c.spareCategoryName, c]));

        const spareSubCategoryNamesInFile = jsonData
            .map((r) => String(r['Danh mục phụ tùng con'] || '').trim())
            .filter(Boolean);
        const existingSpareSubCategorys = await SpareSubCategoryModel.find({
            spareSubCategoryName: { $in: spareSubCategoryNamesInFile },
        });
        const existingMap = new Map(
            existingSpareSubCategorys.map((m) => [`${m.spareSubCategoryName}-${m.spareCategory?.toString()}`, true])
        );

        for (const row of jsonData) {
            const stt = row.STT;
            const spareCategoryName = row['Danh mục phụ tùng'] ? String(row['Danh mục phụ tùng']).trim() : '';
            const spareSubCategoryName = row['Danh mục phụ tùng con'] ? String(row['Danh mục phụ tùng con']).trim() : '';
            if (!spareCategoryName || !spareSubCategoryName) {
                errors.push(`❌ Lỗi ở dòng có STT là: ${stt}`);
                continue;
            }
            let spareCategory = categoryMap.get(spareCategoryName);
            if (!spareCategory) {
                spareCategory = await SpareCategoryModel.create({
                    spareCategoryName,
                    // resourceImportData: resourceImportData._id,
                });
                categoryMap.set(spareCategoryName, spareCategory);
            }
            const sapreCategoryIdStr = spareCategory._id.toString();
            const fileKey = `${spareSubCategoryName}-${sapreCategoryIdStr}`;
            if (duplicateInFileChecker.has(fileKey)) {
                warnings.push(
                    `⚠️ Dòng STT ${stt}: Danh mục phụ tùng con "${spareSubCategoryName}" thuộc danh mục phụ tùng chính "${spareCategoryName}" bị lặp lại trong file.`
                );
                continue;
            }
            duplicateInFileChecker.add(fileKey);
            if (existingMap.has(fileKey)) {
                warnings.push(
                    `⚠️ Dòng STT ${stt}: Danh mục phụ tùng con "${spareSubCategoryName}" thuộc danh mục phụ tùng chính "${spareCategoryName}" đã tồn tại trong hệ thống.`
                );
                continue;
            }

            docs.push({
                spareCategory: spareCategory._id,
                spareSubCategoryName,
                // resourceImportData: resourceImportData._id,
            });
        }

        if (errors.length > 0) {
            await rollbackImport(importData._id, filePath);
            return { success: false, errors };
        }
        if (docs.length > 0) {
            await SpareSubCategoryModel.insertMany(docs);
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

const uploadManufacturerExcel = async (filePath, file) => {
    let importData;
    try {
        const { uploadDir, filePath: _filePath, resourceImportData } = await prepareImportFile(file, 'manufacturer');
        const importData = resourceImportData;

        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        const docs = [];
        const errors = [];
        const warnings = [];
        const duplicateInFileChecker = new Set();

        const originNames = [...new Set(jsonData.map((r) => r['Xuất xứ']))];
        const existingOrigins = await OriginModel.find({ originName: { $in: originNames } });
        const originMap = new Map(existingOrigins.map((c) => [c.originName, c]));

        const manufacturerNamesInFile = jsonData.map((r) => String(r['Hãng sản xuất'] || '').trim()).filter(Boolean);
        const existingManufacturers = await Manufacturer.find({
            manufacturerName: { $in: manufacturerNamesInFile },
        });
        const existingMap = new Map(
            existingManufacturers.map((m) => [`${m.manufacturerName}-${m.origin?.toString()}`, true])
        );

        for (const row of jsonData) {
            const stt = row.STT;
            const originName = row['Xuất xứ'] ? String(row['Xuất xứ']).trim() : '';
            const manufacturerName = row['Hãng sản xuất'] ? String(row['Hãng sản xuất']).trim() : '';
            if (!originName || !manufacturerName) {
                errors.push(`❌ Lỗi ở dòng có STT là: ${stt}`);
                continue;
            }
            let origin = originMap.get(originName);
            if (!origin) {
                origin = await OriginModel.create({
                    originName,
                    resourceImportData: resourceImportData._id,
                });
                originMap.set(originName, origin);
            }
            const originIdStr = origin._id.toString();
            const fileKey = `${manufacturerName}-${originIdStr}`;
            if (duplicateInFileChecker.has(fileKey)) {
                warnings.push(
                    `⚠️ Dòng STT ${stt}: Hãng "${manufacturerName}" với xuất xứ "${originName}" bị lặp lại trong file.`
                );
                continue;
            }
            duplicateInFileChecker.add(fileKey);
            if (existingMap.has(fileKey)) {
                warnings.push(
                    `⚠️ Dòng STT ${stt}: Hãng "${manufacturerName}" thuộc "${originName}" đã tồn tại trong hệ thống.`
                );
                continue;
            }

            docs.push({
                origin: origin._id,
                manufacturerName,
                resourceImportData: resourceImportData._id,
            });
        }

        if (errors.length > 0) {
            await rollbackImport(importData._id, filePath);
            return { success: false, errors };
        }
        if (docs.length > 0) {
            await Manufacturer.insertMany(docs);
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

module.exports = {
    rollbackImport,
    prepareImportFile,
    uploadAssetMaintenanceExcel,
    // findOrCreate
    uploadCategoryExcel,
    uploadSubCategoryExcel,
    uploadAssetExcel,
    uploadSpareCategoryExcel,
    uploadSpareSubCategoryExcel,
    uploadManufacturerExcel,
};
