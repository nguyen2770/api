const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const catchAsync = require('../../utils/catchAsync');
const {
    assetMaintenanceService,
    manufacturerService,
    assetService,
    categoryService,
    resourceService,
    subCategoryService,
    assetModelService,
    buildingService,
    floorService,
    departmentService,
    communeService,
    provinceService,
    assetDepreciationService,
    assetModelSparePartService,
    sequenceService,
    branchService,
} = require('../../services');
const ApiError = require('../../utils/ApiError');
const { Breakdown, PreventiveModel, AssetMaintenance } = require('../../models');
const dayjs = require('dayjs');
const mongoose = require('mongoose');
const { createNewUsingAFormulaType, assetStyle } = require('../../utils/constant');
const { syncLocationData } = require('../../utils/syncLocation');
const { Types } = mongoose;
/**
 * Create a user
 * @type {(function(*, *, *): void)|*}
 */

const createAssetMaintenance = catchAsync(async (req, res) => {
    const assetMaintenance = { ...req.body };
    // assetMaintenance.updatedBy = req.user.id;
    // assetMaintenance.createdBy = req.user.id;
    const { assetModel } = req.body;
    const dataAssetMaintenance = {
        ...assetMaintenance,
        assetModel: assetModel.id,
        assetModelName: assetModel.assetModelName,
        assetName: assetModel.asset?.assetName,
        manufacturerName: assetModel.manufacturer?.manufacturerName,
        categoryName: assetModel.category?.categoryName,
        assetTypeCategory: assetModel.assetTypeCategory?.name,
        subCategoryName: assetModel.subCategory?.subCategoryName,
    };
    if (assetMaintenance && assetMaintenance.firstInspectionDate && assetMaintenance.lifeSpan && assetMaintenance.Period) {
        assetMaintenance.nextInspectionDate = generateNextInspectionDate(
            assetMaintenance.firstInspectionDate,
            assetMaintenance.lifeSpan,
            assetMaintenance.Period
        );
    }
    // TẠO MỚI ASSETmOADL
    // const existed = await assetMaintenanceService.getAssetMaintenanceByData({ internalCode: assetMaintenance.internalCode });
    // if (existed && existed.length > 0) {
    //     return res.status(httpStatus.CREATED).send({ code: 0, message: 'Mã nội bộ đã tồn tại', existed });
    // }
    // let assetModelId;
    // if (assetModel) {
    //     // Đã tồn tại, lấy _id của assetModel đầu tiên
    //     assetModelId = assetModel._id;
    // } else {
    //     // Chưa có, tạo mới
    //     const newAssetModel = {
    //         assetModelName: assetMaintenance.assetModelName,
    //         category: assetChange.category ? assetChange.category.id : null,
    //         subCategory: assetChange.subCategory ? assetChange.subCategory.id : null,
    //         asset: assetChange.id,
    //         manufacturer: assetChange.manufacturer ? assetChange.manufacturer.id : null,
    //     };
    //     const createdAssetModel = await assetMaintenanceService.createAssetModel(newAssetModel);
    //     assetModelId = createdAssetModel._id;
    // }

    // kiểm tra xem asset number có tự tạo hay là tự sinh
    if (req.companySetting?.autoGenerateAssetNumber && dataAssetMaintenance.asset) {
        if (
            req.companySetting?.createNewUsingAFormula &&
            dataAssetMaintenance.fundingSources &&
            req.companySetting?.createNewUsingAFormula === createNewUsingAFormulaType.healthInsurance
        ) {
            const result = await assetMaintenanceService.checkForDuplicates(
                req.company,
                dataAssetMaintenance.asset,
                dataAssetMaintenance.fundingSources,
                dataAssetMaintenance.assetNumber,
                dataAssetMaintenance.serial
            );

            if (result.isDuplicate) {
                return res.status(httpStatus.CREATED).send({
                    code: 409,
                    ...result,
                });
            }
            var currentAssetNumber = await sequenceService.generateCurrentAssetNumberBySequense(
                req.company,
                dataAssetMaintenance.asset,
                dataAssetMaintenance.fundingSources
            );
            if (dataAssetMaintenance.assetNumber === currentAssetNumber) {
                await sequenceService.saveCurrentAssetNumber(req.company);
            }
        } else {
            if (!dataAssetMaintenance.assetNumber) {
                dataAssetMaintenance.assetNumber = await sequenceService.generateSequenceCode('ASSET_NUMBER');
            }
        }
    } else {
        if (!dataAssetMaintenance.assetNumber) {
            dataAssetMaintenance.assetNumber = await sequenceService.generateSequenceCode('ASSET_NUMBER');
        }
    }
    // const createdAssetMaintenance = await assetMaintenanceService.createAssetMaintenance(dataAssetMaintenance);
    // const { commune, province, addressNote, building, floor, department, branch, customer } = assetMaintenance;
    // const hasLocationData = [commune, province, addressNote, building, floor, department, branch, customer].some(Boolean);
    // if (hasLocationData) {
    //     await assetMaintenanceService.createAssetMaintenanceLocationHistory({
    //         ...dataAssetMaintenance,
    //         createdBy: req.user.id,
    //         assetMaintenance: createdAssetMaintenance._id,
    //     });
    // }
    // res.status(httpStatus.CREATED).send({
    //     code: 1,
    //     createdAssetMaintenance,
    //     // existed,
    // });

    let createdAssetMaintenance;
    try {
        createdAssetMaintenance = await assetMaintenanceService.createAssetMaintenance(dataAssetMaintenance, assetModel.id);
        const records = await assetDepreciationService.createAssetDepreciation(createdAssetMaintenance, req.user.id);
        // lưu lịch sử asset maintenance SparePart
        if (createdAssetMaintenance.assetModel) {
            const assetModelSpareParts = await assetModelSparePartService.getAssetModelSparePartByRes({
                assetModel: createdAssetMaintenance.assetModel,
            });
            if (assetModelSpareParts && assetModelSpareParts.length > 0) {
                for (const item of assetModelSpareParts) {
                    await assetMaintenanceService.createHistoryAssetMaintenanceSparePart({
                        assetMaintenance: createdAssetMaintenance._id,
                        sparePart: item.sparePart,
                        quantity: item.quantity,
                        assetModelSparePart: item._id,
                        replacementDate: createdAssetMaintenance.firstInspectionDate || createdAssetMaintenance.createdAt,
                    });
                }
            }
        }
        res.status(httpStatus.CREATED).send({
            code: 1,
            createdAssetMaintenance,
            // existed,
            records,
        });
    } catch (error) {
        if (createdAssetMaintenance) {
            await AssetMaintenance.findByIdAndDelete(createdAssetMaintenance.id);
            if (createdAssetMaintenance.assetModel) {
                await assetMaintenanceService.deleteHistoryAssetMaintenanceSparePartByRes({
                    assetMaintenance: createdAssetMaintenance._id,
                });
            }
        }
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
    }
});

const getAssetMaintenances = catchAsync(async (req, res) => {
    const filter = pick(req.body, [
        'serial',
        'assetModel',
        'customer',
        'asset',
        'qrCode',
        'manufacturer',
        'category',
        'subCategory',
        'assetStyle',
        'assetNumber',
        'assetAges',
        'assetName',
        'searchText',
        'branchs',
        'assetStatus',
        'assetStatuses',
    ]);
    const options = pick(req.body, ['sortBy', 'limit', 'page']);
    const result = await assetMaintenanceService.queryAssetMaintenances(filter, options, req);
    const year = new Date().getFullYear();
    // Tính downtime cho từng assetMaintenance
    const resultsWithDowntime = await Promise.all(
        result.results.map(async (item) => {
            const totalDowntime = await assetMaintenanceService.totalEquipmentDowntime(item._id, year);
            // thêm đoạn này để k thay đổi cấu trúc có trước
            const branchName = await branchService.getBranchNameById(item.branch);
            const departmentName = await departmentService.getDepartmentNameById(item.department);
            return {
                ...item.toJSON(), // nếu item là mongoose document
                totalDowntime,
                branchName,
                departmentName,
            };
        })
    );

    res.send({
        results: {
            ...result,
            results: resultsWithDowntime, // giữ nguyên key `results`
            countAssetMaintence: resultsWithDowntime.length,
            code: 1,
        },
        // results: result, countAssetMaintence: result.results.length,
    });
});

const getAssetMaintenanceById = catchAsync(async (req, res) => {
    const assetMaintenance = await assetMaintenanceService.getAssetMaintenanceById(req.query.id);
    if (!assetMaintenance) {
        throw new ApiError(httpStatus.NOT_FOUND, 'asset maintenance not found');
    }
    let getResource = null;
    if (assetMaintenance.resourceId) {
        getResource = await resourceService.getResourceById(assetMaintenance.resourceId);
    }
    const assetModel = await assetModelService.getAssetModelById(assetMaintenance.assetModel);
    if (!assetModel) {
        return res.status(httpStatus.NOT_FOUND).send({ code: 0, message: 'Asset model not found' });
    }
    const [commune, province, building, floor, department] = await Promise.all([
        communeService.getCommuneById(assetMaintenance.commune),
        provinceService.getProvinceById(assetMaintenance.province),
        buildingService.getBuildingById(assetMaintenance.building),
        floorService.getFloorById(assetMaintenance.floor),
        departmentService.getDepartmentById(assetMaintenance.department),
    ]);
    const location = {
        commune,
        province,
        building,
        floor,
        department,
    };
    const assetMaintenanceWithLocation = {
        ...(assetMaintenance.toJSON() || assetMaintenance),
        location,
    };

    const asset = await assetService.getMoreInfo(assetModel.asset);
    res.send({
        code: 1,
        data: assetMaintenanceWithLocation,
        resource: getResource,
        asset: { ...asset, ...assetModel.toObject() },
        location,
    });
});
const getAssetMaintenance = catchAsync(async (req, res) => {
    const assetMaintenance = await assetMaintenanceService.getAssetMaintenance(req.query.id);
    console.log('assetMaintenance', assetMaintenance);
    if (!assetMaintenance) {
        throw new ApiError(httpStatus.NOT_FOUND, 'asset maintenance not found');
    }
    let getResource = null;
    if (assetMaintenance.resourceId) {
        getResource = await resourceService.getResourceById(assetMaintenance.resourceId);
    }
    const assetModel = await assetModelService.getAssetModelById(assetMaintenance.assetModel);
    if (!assetModel) {
        return res.status(httpStatus.NOT_FOUND).send({ code: 0, message: 'Asset model not found' });
    }
    const asset = await assetService.getMoreInfo(assetModel.asset);
    res.send({ code: 1, data: assetMaintenance, resource: getResource, asset: { ...asset, ...assetModel.toObject() } });
});
/**
 * Update user by id.
 * @type {(function(*, *, *): void)|*}
 */
const updateAssetMaintenance = catchAsync(async (req, res) => {
    const assetMaintenance = { ...req.body };
    if (assetMaintenance && assetMaintenance.firstInspectionDate && assetMaintenance.lifeSpan && assetMaintenance.Period) {
        assetMaintenance.nextInspectionDate = generateNextInspectionDate(
            assetMaintenance.firstInspectionDate,
            assetMaintenance.lifeSpan,
            assetMaintenance.Period
        );
    }
    const { assetModel, id } = req.body;
    // const existed = await assetMaintenanceService.getAssetMaintenanceByData({ internalCode: assetMaintenance.internalCode });
    // if (existed && existed.length > 0 && !(existed.length === 1 && existed[0]._id.toString() === id)) {
    //     return res.status(httpStatus.CREATED).send({ code: 0, message: 'Mã nội bộ  đã tồn tại', existed });
    // }
    // const existedQrCode = await assetMaintenanceService.getAssetMaintenanceByQrCode(assetMaintenance.qrCode);
    // if (
    //     existedQrCode &&
    //     existedQrCode.length > 0 &&
    //     !(existedQrCode.length === 1 && existedQrCode[0]._id.toString() === id)
    // ) {
    //     return res.status(httpStatus.CREATED).send({ code: 0, message: 'QR Code đã tồn tại' });
    // }
    // const assetModel = await assetModelService.findOne({
    //     assetModelName: assetMaintenance.assetModelName,
    //     category: assetChange.category ? assetChange.category.id : null,
    //     subCategory: assetChange.subCategory ? assetChange.subCategory.id : null,
    //     asset: assetChange.id,
    //     manufacturer: assetChange.manufacturer ? assetChange.manufacturer.id : null,
    // });

    // if (assetModel) {
    //     // Đã tồn tại, lấy _id của assetModel đầu tiên
    //     assetModelId = assetModel._id;
    // } else {
    //     // Chưa có, tạo mới
    //     const newAssetModel = {
    //         assetModelName: assetMaintenance.assetModelName,
    //         category: assetChange.category ? assetChange.category.id : null,
    //         subCategory: assetChange.subCategory ? assetChange.subCategory.id : null,
    //         asset: assetChange.id,
    //         manufacturer: assetChange.manufacturer ? assetChange.manufacturer.id : null,
    //     };
    //     const createdAssetModel = await assetMaintenanceService.createAssetModel(newAssetModel);
    //     assetModelId = createdAssetModel._id;
    // }
    if (assetMaintenance.resource == null) {
        await resourceService.deleteResourceById(assetMaintenance.resource);
    }
    const data = {
        ...assetMaintenance,
        assetModel: assetModel.id,
        assetModelName: assetModel.assetModelName,
        assetName: assetModel.asset?.assetName,
        manufacturerName: assetModel.manufacturer?.manufacturerName,
        categoryName: assetModel.category?.categoryName,
        assetTypeCategory: assetModel.assetTypeCategory?.name,
        subCategoryName: assetModel.subCategory?.subCategoryName,
    };
    await syncLocationData(id, data, async (oldData, newData) => {
        await assetMaintenanceService.updateLocationForWorkNotStarted(id, newData);
        // thêm phần lưu lịch sử lại khi update
        const assetMaintenance = await AssetMaintenance.findById(id).lean();
        await assetMaintenanceService.createAssetMaintenanceLocationHistory({
            ...newData,
            assetMaintenance: id,
            oldCustomer: assetMaintenance.customer,
            oldCommune: assetMaintenance.commune,
            oldProvince: assetMaintenance.province,
            oldBuilding: assetMaintenance.building,
            oldFloor: assetMaintenance.floor,
            oldDepartment: assetMaintenance.department,
            oldBranch: assetMaintenance.branch,
            oldAddressNote: assetMaintenance.addressNote,
            createdBy: req.user.id,
        });
    });

    let oldAssetMaintenance, records;
    try {
        oldAssetMaintenance = await AssetMaintenance.findById(id).lean();
        // đc gen lại theo ngày cài đặt mới
        if (data.assetNumber !== oldAssetMaintenance.assetNumber) {
            // kiểm tra xem asset number có tự tạo hay là tự sinh
            if (req.companySetting?.autoGenerateAssetNumber && data.asset) {
                if (
                    req.companySetting?.createNewUsingAFormula &&
                    data.fundingSources &&
                    req.companySetting?.createNewUsingAFormula === createNewUsingAFormulaType.healthInsurance
                ) {
                    const result = await assetMaintenanceService.checkForDuplicatesUpdate(
                        req.company,
                        data.asset,
                        data.fundingSources,
                        data.assetNumber,
                        data.serial,
                        oldAssetMaintenance._id
                    );

                    if (result.isDuplicate) {
                        return res.status(httpStatus.CREATED).send({
                            code: 409,
                            ...result,
                        });
                    }
                    var currentAssetNumber = await sequenceService.generateCurrentAssetNumberBySequense(
                        req.company,
                        data.asset,
                        data.fundingSources
                    );
                    if (data.assetNumber === currentAssetNumber) {
                        await sequenceService.saveCurrentAssetNumber(req.company);
                    }
                } else {
                    if (!data.assetNumber || data.assetNumber === null) {
                        data.assetNumber = await sequenceService.generateSequenceCode('ASSET_NUMBER');
                    }
                }
            } else {
                if (!data.assetNumber || data.assetNumber === null) {
                    data.assetNumber = await sequenceService.generateSequenceCode('ASSET_NUMBER');
                }
            }
        }
        const updated = await assetMaintenanceService.updateAssetMaintenanceById(id, data);
        if (oldAssetMaintenance.depreciationType === 'null' && data.depreciationType !== 'null') {
            records = await assetDepreciationService.updateAssetDepreciation(updated, req.user.id);
        }
        if (
            oldAssetMaintenance.assetModel &&
            assetModel.id &&
            oldAssetMaintenance.assetModel.toString() !== assetModel.id.toString()
        ) {
            // Xóa lịch sử phụ tùng cũ
            await assetMaintenanceService.deleteHistoryAssetMaintenanceSparePartByRes({ assetMaintenance: id });
            // Thêm lịch sử phụ tùng mới
            const assetModelSpareParts = await assetModelSparePartService.getAssetModelSparePartByRes({
                assetModel: assetModel.id,
            });
            if (assetModelSpareParts && assetModelSpareParts.length > 0) {
                for (const item of assetModelSpareParts) {
                    const lastHistory = await assetMaintenanceService.lastHistoryAssetMaintenanceSparePart({
                        assetMaintenance: assetMaintenance._id,
                        sparePart: item.sparePart,
                    });
                    await assetMaintenanceService.createHistoryAssetMaintenanceSparePart({
                        assetMaintenance: id,
                        sparePart: item.sparePart,
                        quantity: item.quantity,
                        assetModelSparePart: item._id,
                        replacementDate: lastHistory
                            ? lastHistory.replacementDate
                            : updated.installationDate || updated.createdAt,
                    });
                }
            }
        }
        res.send({
            code: 1,
            datas: updated,
            // records: records,
        });
    } catch (error) {
        if (oldAssetMaintenance) {
            const rollbackData = { ...oldAssetMaintenance };
            await assetMaintenanceService.updateAssetMaintenanceById(id, rollbackData);
            syncLocationData(id, oldAssetMaintenance, async (oldData, newData) => {
                await assetMaintenanceService.updateLocationForWorkNotStarted(id, newData);
            });
        }
        throw error;
    }
});

/**
 * Delete user by id.
 * @type {(function(*, *, *): void)|*}
 */
const deleteAssetMaintenance = catchAsync(async (req, res) => {
    const assetMaintenance = await assetMaintenanceService.getAssetMaintenanceById(req.query.id);
    if (!assetMaintenance) {
        return res.status(httpStatus.NOT_FOUND).send({ code: 0, message: 'Asset maintenance not found' });
    }
    const breakdowns = await Breakdown.countDocuments({ assetMaintenance: req.query.id });
    const preventives = await PreventiveModel.countDocuments({ assetMaintenance: req.query.id });
    if (breakdowns > 0 || preventives > 0) {
        return res.send({ code: 0, message: 'Tài sản đang còn được sử dụng' });
    }
    // Xóa lịch trình khấu hao nếu có.
    await assetDepreciationService.deleteAssetDepreciation(assetMaintenance.id);
    await assetMaintenanceService.deleteAssetMaintenanceById(req.query.id);
    if (assetMaintenance.assetModel) {
        await assetMaintenanceService.deleteHistoryAssetMaintenanceSparePartByRes({ assetMaintenance: req.query.id });
    }
    // Xóa resource nếu có
    if (assetMaintenance.resourceId) {
        await resourceService.deleteResourceById(assetMaintenance.resourceId);
    }
    res.status(httpStatus.OK).send({ code: 1 });
});

const updateStatus = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body.data;
    const updated = await assetMaintenanceService.updateStatus(id, updateData);
    res.send({ code: 1, data: updated });
});

const getAllAssetMaintenance = catchAsync(async (req, res) => {
    const assetMaintenances = await assetMaintenanceService.getAllAssetMaintenance();
    res.send({ code: 1, data: assetMaintenances });
});

const getAllSub = catchAsync(async (req, res) => {
    const allManufacturer = await manufacturerService.getAllManufacturer();
    const allCategory = await categoryService.getAllCategory();
    const allAsset = await assetService.getAllAsset();
    const allDepreciationBase = await assetMaintenanceService.getAllDepreciationBase();
    const allDepreciationtype = await assetMaintenanceService.getAllDepreciationType();
    const allSubCategory = await subCategoryService.getAllSubCategory();
    res.send({
        code: 1,
        manufacturers: allManufacturer,
        categorys: allCategory,
        assets: allAsset,
        depreciationBases: allDepreciationBase,
        depreciationTypes: allDepreciationtype,
        subCategorys: allSubCategory,
    });
});

const getAssetModelRes = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['category', 'subCategory', 'asset', 'manufacturer']);

    const assetModels = await assetMaintenanceService.getAssetModelByRes(filter);
    res.send({ code: 1, data: assetModels });
});
const getAssetMaintenanceRes = catchAsync(async (req, res) => {
    const filter = pick(req.query, [
        'category',
        'assetId',
        'manufacturer',
        'assetType',
        'customerId',
        'assetModelId',
        'assetStyle',
    ]);
    const assetMaintenances = await assetMaintenanceService.getAssetMaintenanceByRes(filter);
    res.send({ code: 1, data: assetMaintenances });
});
const deleteManyAssetMaintenance = catchAsync(async (req, res) => {
    let listId = req.query.ids;
    // Nếu là chuỗi, tách thành mảng
    if (typeof listId === 'string') {
        listId = listId
            .split(',')
            .map((id) => id.trim())
            .filter(Boolean);
    }
    if (!Array.isArray(listId) || listId.length === 0) {
        return res.status(httpStatus.BAD_REQUEST).send({ code: 0, message: 'No ids provided' });
    }
    const deleted = [];
    const notFound = [];
    const failed = [];

    await Promise.all(
        listId.map(async (id) => {
            try {
                const assetMaintenance = await assetMaintenanceService.getAssetMaintenanceById(id);
                if (!assetMaintenance) {
                    notFound.push(id);
                    return;
                }
                // Xóa resource nếu có
                if (assetMaintenance.resourceId) {
                    await resourceService.deleteResourceById(assetMaintenance.resourceId);
                }
                // Xóa assetMaintenance
                await assetMaintenanceService.deleteAssetMaintenanceById(id);
                deleted.push(id);
            } catch (err) {
                failed.push({ id, error: err.message });
            }
        })
    );

    res.status(httpStatus.OK).send({
        code: 1,
        message: 'Batch delete complete',
        deleted,
        notFound,
        failed,
    });
});
const getAllAssetModel = catchAsync(async (req, res) => {
    const assetModels = await assetMaintenanceService.getAllAssetModel();
    res.send({ code: 1, data: assetModels });
});
const createAssetMaintenanceLocationHistory = catchAsync(async (req, res) => {
    const assetMaintenanceLocationHistory = { ...req.body };
    assetMaintenanceLocationHistory.updatedBy = req.user.id;
    const { assetMaintenance } = req.body;
    assetMaintenanceLocationHistory.createdBy = req.user.id;
    await syncLocationData(assetMaintenance, assetMaintenanceLocationHistory, async (oldData, newData) => {
        await assetMaintenanceService.updateLocationForWorkNotStarted(assetMaintenance, newData);
    });
    if (assetMaintenance) {
        await assetMaintenanceService.updateAssetMaintenanceById(assetMaintenance, assetMaintenanceLocationHistory);
    }
    const _createAssetMaintenanceLocationHistory = await assetMaintenanceService.createAssetMaintenanceLocationHistory({
        ...assetMaintenanceLocationHistory,
        assetMaintenance,
    });
    res.status(httpStatus.CREATED).send({
        code: 1,
        _createAssetMaintenanceLocationHistory,
    });
});
const getAssetMaintenanceLocationHistoryByRes = catchAsync(async (req, res) => {
    const assetMaintenanceLocationHistoryByReses = await assetMaintenanceService.getAssetMaintenanceLocationHistoryByRes({
        assetMaintenance: req.query.assetMaintenance,
    });
    res.status(httpStatus.CREATED).send({
        code: 1,
        data: assetMaintenanceLocationHistoryByReses,
    });
});
const getAllDownTimeAssetMaintenance = catchAsync(async (req, res) => {
    const assetMaintenance = await assetMaintenanceService.getAssetMaintenanceById(req.params.id);
    const yearCreated = new Date(assetMaintenance.createdAt).getFullYear();
    const yearNow = new Date().getFullYear();

    const downtimeByYears = [];

    for (let year = yearNow; year >= yearCreated; year--) {
        const startDate = new Date(`${year}-01-01`);
        const endDate = new Date(`${year}-12-31`);

        const { time, data } = await assetMaintenanceService.calcularDowntimeOfAssetMaintenanceShowStartEndTime(
            req.params.id,
            startDate,
            endDate,
            year
        );

        downtimeByYears.push({
            year,
            totalDowntime: time,
            details: data,
        });
    }

    res.status(httpStatus.OK).send({
        code: 1,
        data: downtimeByYears,
    });
});

const getAssetSummary = catchAsync(async (req, res) => {
    const filter = pick(req.body, ['branchs']);
    const assetSummary = await assetMaintenanceService.getAssetSummary(filter, req);
    res.send({ code: 1, data: assetSummary });
});
const nextDay = (date, interval, period) => {
    switch (period) {
        case 1: {
            return date.add(interval, 'day');
        }
        case 2: {
            return date.add(interval, 'week');
        }
        case 3: {
            return date.add(interval, 'month');
        }
        case 4: {
            return date.add(interval, 'year');
        }
    }
};
const generateNextInspectionDate = (lasttInspectionDate, lifeSpan, period) => {
    let _firstInspectionDate = dayjs(lasttInspectionDate);
    let _nextDay = nextDay(_firstInspectionDate, lifeSpan, period);
    if (_nextDay > dayjs()) {
        return _nextDay;
    } else {
        return generateNextInspectionDate(_nextDay, lifeSpan, period);
    }
};

const getAssetMaintenanceDueInspections = catchAsync(async (req, res) => {
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const filters = pick(req.query, ['nextInspectionDate', 'serial', 'assetNumber']);
    const assetMaintenanceDueInspections = await assetMaintenanceService.getAssetMaintenanceDueInspections(
        req.user.company,
        options,
        filters
    );
    res.send({ code: 1, data: assetMaintenanceDueInspections });
});
const updateData = catchAsync(async (req, res) => {
    const assetMaintenanceDueInspections = await assetMaintenanceService.updateData();
    res.send({ code: 1, data: assetMaintenanceDueInspections });
});

const getCurrentAssetNumber = catchAsync(async (req, res) => {
    console.log('req.query', req.companySetting);
    const currentAssetNumber = await assetMaintenanceService.getCurrentAssetNumber(
        req.company,
        req.query.asset,
        req.query.serial,
        req.query.fundingSources
    );
    res.send({ code: 1, data: currentAssetNumber });
});
const getAssetMaintenanceMobile = catchAsync(async (req, res) => {
    const body = req.body;

    const filter = {};

    if (body.assetStyles?.length) {
        filter.assetStyle = { $in: body.assetStyles };
    }

    if (body.customers?.length) {
        filter.customerName = { $in: body.customers };
    }

    if (body.manufacturers?.length) {
        filter.manufacturerName = { $in: body.manufacturers };
    }

    if (body.categories?.length) {
        filter.categoryName = { $in: body.categories };
    }

    if (body.assetModels?.length) {
        filter.assetModel = { $in: body.assetModels.map((id) => Types.ObjectId(id)) };
    }

    if (body.assets?.length) {
        filter.asset = { $in: body.assets.map((id) => Types.ObjectId(id)) };
    }

    const options = pick(body, ['sortBy', 'limit', 'page']);

    const result = await assetMaintenanceService.getAssetMaintenanceMobile(filter, options);

    res.send({ code: 1, results: result });
});
const getAssetMaintenanceChecklistByRes = catchAsync(async (req, res) => {
    const checklists = await assetMaintenanceService.getAssetMaintenanceChecklistByRes(req.body);
    res.status(httpStatus.OK).send({ code: 1, data: checklists });
});
const updateAssetMaintenanceChecklistByAssetMaintenance = catchAsync(async (req, res) => {
    const { assetMaintenance, checklists } = req.body;
    await assetMaintenanceService.updateAssetMaintenanceChecklistByAssetMaintenance(assetMaintenance, checklists);
    res.status(httpStatus.OK).send({ code: 1 });
});

const requestCancelAsset = catchAsync(async (req, res) => {
    const { cancelReason, fileList } = req.body;
    const data = await assetMaintenanceService.requestCancelAsset(req.body.id, cancelReason, fileList);
    res.status(httpStatus.OK).send({ code: 1, data: data });
});

const approveCancelAsset = catchAsync(async (req, res) => {
    const data = await assetMaintenanceService.approveCancelAsset(req.body.id);
    res.status(httpStatus.OK).send({ code: 1, data: data });
});
const getPropertyAccessoriesByAssetMaintenance = catchAsync(async (req, res) => {
    const data = await assetMaintenanceService.getPropertyAccessoriesByAssetMaintenance(req.body.id);
    res.send({ code: 1, data });
});
const mapPropertyAccessoriesWithAssetMaintenance = catchAsync(async (req, res) => {
    const data = await assetMaintenanceService.mapPropertyAccessoriesWithAssetMaintenance(
        req.body.id,
        req.body.listPropertyAccessories
    );
    res.send({ code: 1, data });
});
const getPropertyAccessoriesNotMap = catchAsync(async (req, res) => {
    const baseFilter = pick(req.body, [
        'serial',
        'assetModel',
        'customer',
        'asset',
        'qrCode',
        'manufacturer',
        'category',
        'subCategory',
        'assetNumber',
    ]);
    const options = pick(req.body, ['sortBy', 'limit', 'page']);
    baseFilter.assetStyle = assetStyle.accessories;
    baseFilter.parentId = null;
    const unassignedAssets = await assetMaintenanceService.queryAssetMaintenances(baseFilter, options);
    res.send({ code: 1, data: unassignedAssets });
});
const deleteParentIdInPropertyAccessories = catchAsync(async (req, res) => {
    const assetMaintenance = await assetMaintenanceService.deleteParentIdInPropertyAccessories(req.query.id);
    res.send({ code: 1, assetMaintenance });
});
const updateAssetStatus = catchAsync(async (req, res) => {
    const data = await assetMaintenanceService.updateAssetStatus(req.body.id);
    res.status(httpStatus.OK).send({ code: 1, data: data });
});

const requestReturnAsset = catchAsync(async (req, res) => {
    const { cancelReason, fileList } = req.body;
    const data = await assetMaintenanceService.requestReturnAsset(req.body.id, cancelReason, fileList);

    res.status(httpStatus.OK).send({ code: 1, data: data });
});

const approveReturnAsset = catchAsync(async (req, res) => {
    const data = await assetMaintenanceService.approveReturnAsset(req.body.id);
    res.status(httpStatus.OK).send({ code: 1, data: data });
});

const disposalAsset = catchAsync(async (req, res) => {
    const { fileList } = req.body;
    const data = await assetMaintenanceService.disposalAsset(req.body.id, fileList);

    res.status(httpStatus.OK).send({ code: 1, data: data });
});
module.exports = {
    createAssetMaintenance,
    getAssetMaintenances,
    getAssetMaintenanceById,
    updateAssetMaintenance,
    deleteAssetMaintenance,
    updateStatus,
    getAllAssetMaintenance,
    getAllSub,
    getAssetModelRes,
    deleteManyAssetMaintenance,
    getAllAssetModel,
    getAssetMaintenanceRes,
    getAssetMaintenance,
    createAssetMaintenanceLocationHistory,
    getAssetMaintenanceLocationHistoryByRes,
    getAllDownTimeAssetMaintenance,
    getAssetSummary,
    getAssetMaintenanceDueInspections,
    updateData,
    getAssetMaintenanceMobile,
    getCurrentAssetNumber,
    getAssetMaintenanceChecklistByRes,
    updateAssetMaintenanceChecklistByAssetMaintenance,
    requestCancelAsset,
    approveCancelAsset,
    getPropertyAccessoriesByAssetMaintenance,
    mapPropertyAccessoriesWithAssetMaintenance,
    getPropertyAccessoriesNotMap,
    deleteParentIdInPropertyAccessories,
    updateAssetStatus,
    approveReturnAsset,
    requestReturnAsset,
    disposalAsset,
};
