const mongoose = require('mongoose');
const httpStatus = require('http-status');
const {
    AssetMaintenance,
    DepreciationBase,
    DepreciationType,
    AssetModel,
    Asset,
    AssetMaintenanceLocationHistoryModel,
    Breakdown,
    SchedulePreventiveModel,
    AssetMaintenanceIsNotActiveHistoryModel,
    AssetTypeCategoryModel,
    Category,
    Manufacturer,
    SubCategory,
    Customer,
    HistoryAssetMaintenanceSparePartModel,
    CalibrationWorkModel,
    AssetMaintenanceChecklistModel,
    AssetModelChecklistModel,
    Department,
    Branch,
    AssetMaintenanceDocument,
} = require('../../models');
const ApiError = require('../../utils/ApiError');
const breakdownService = require('./breakdown.service');
const sequenceService = require('./sequence.service');
const schedulePreventiveService = require('../preventive/schedulePreventive.service');
const SchedulePreventive = require('../../models/preventive/schedulePreventive.model');
const { NotificationSettingModel } = require('../../models/notification');
const {
    ticketBreakdownStatus,
    ticketPreventiveStatus,
    calibrationWorkGroupStatus,
    assetStatus,
    schedulePreventiveWorkingStatus,
    calibrationWorkStatus,
    schedulePreventiveStatus,
    assetStyle,
    assetMaintenanceStatus,
    breakdownStatus,
    progressStatus,
    workAsset,
    assetMaintenanceDocumentFileType,
} = require('../../utils/constant');
const AssetModelChecklist = require('../../models/assets/assetModelChecklist.model');
const CalibrationWork = require('../../models/calibration/calibrationWork.model');
const SchedulePreventiveCheckInCheckOut = require('../../models/preventive/schedulePreventiveCheckinCheckOut.model');
const CalibrationWorkCheckinCheckOut = require('../../models/calibration/calibrationWorkCheckinCheckOut.model');
const SchedulePreventiveTask = require('../../models/preventive/schedulePreventiveTask.model');
const AssetMaintenanceLocationHistory = require('../../models/common/assetMaintenanceLocationHistory.model');

// /**
//  *
//  * @returns
//  */
// const savecAsset = async (status) => {
//     const create = await Asset.create({
//         status,
//     });
//     return create;
// };

/**
 * Create a user
 * @param {Object} category
 * @returns {Promise<User>}
 */
const createAssetMaintenance = async (data, assetModel) => {
    if (data && data.assetNumber) {
        const countAssetMaintenance = await AssetMaintenance.countDocuments({ assetNumber: data.assetNumber });
        if (countAssetMaintenance > 0) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Mã tài sản này đã được sử dụng');
        }
    }
    const create = await AssetMaintenance.create(data);
    const assetModelCheckList = await AssetModelChecklistModel.find({ assetModel: assetModel });
    for (const checklist of assetModelCheckList) {
        await AssetMaintenanceChecklistModel.create({
            assetModel: checklist.assetModel,
            index: checklist.index,
            content: checklist.content,
            assetMaintenance: create._id,
        });
    }
    return create;
};
const createAssetModel = async (data) => {
    return AssetModel.create(data);
};
const getAssetMaintenanceByData = async (data) => {
    return AssetMaintenance.find(data);
};
const getAssetMaintenanceByQrCode = async (data) => {
    return AssetMaintenance.find({ qrCode: data });
};
const getAssetModelByName = async (data) => {
    return AssetModel.find({ assetModelName: data });
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
const queryAssetMaintenances = async (_filter, options, req) => {
    const filter = { ..._filter };
    // kiểm tra xem có được xem tất cả tài sản không
    let allowViewAll = true;
    if (req?.companySetting?.filterByAccount) {
        const dep = await Department.findById(req.user.department).select('allowViewAll');
        allowViewAll = dep?.allowViewAll;
    }
    if (!allowViewAll) {
        filter.department = mongoose.Types.ObjectId(req?.user?.department);
    }
    if (filter.assetAges && Array.isArray(filter.assetAges)) {
        const now = new Date();
        const ageConditions = filter.assetAges.map((age) => {
            const parsedAge = parseInt(age);
            const startDate = new Date(now.getFullYear() - parsedAge - 1, now.getMonth(), now.getDate() + 1);
            const endDate = new Date(now.getFullYear() - parsedAge, now.getMonth(), now.getDate());
            return { installationDate: { $gte: startDate, $lte: endDate } };
        });
        filter.$or = ageConditions;
        delete filter.assetAges;
    }
    if (filter.assetStatuses) {
        filter.assetStatus = { $in: filter.assetStatuses };
        delete filter.assetStatuses;
    }
    if (filter.branchs) {
        filter.branch = { $in: filter.branchs };
        delete filter.branchs;
    }
    ['assetModel', 'customer', '_id'].forEach((key) => {
        if (filter[key] && typeof filter[key] === 'string' && mongoose.Types.ObjectId.isValid(filter[key])) {
            filter[key] = mongoose.Types.ObjectId(filter[key]);
        }
    });
    const assetFilter = {};
    ['manufacturer', 'category', 'subCategory', 'asset'].forEach((key) => {
        if (filter[key]) {
            assetFilter[key] = filter[key];
            delete filter[key];
        }
    });
    if (filter.assetStyle) {
        filter.assetStyle = Number(filter.assetStyle);
    }
    if (Object.keys(assetFilter).length > 0) {
        const assetModels = await AssetModel.find(assetFilter).select('_id');
        filter.assetModel = { $in: assetModels.map((a) => a._id) };
    }

    // tìm theo textindex
    // if (filter.searchText && typeof filter.searchText === 'string') {
    //     filter.$text = { $search: filter.searchText };
    //     delete filter.searchText;
    // }

    // tìm theo regex (không dùng textindex)
    if (filter.searchText && typeof filter.searchText === 'string') {
        const regex = new RegExp(filter.searchText, 'i');

        filter.$or = [
            { assetName: regex },
            { assetModelName: regex },
            { manufacturerName: regex },
            { categoryName: regex },
            { subCategoryName: regex },
            { serial: regex },
            { assetNumber: regex },
            { customerName: regex },
        ];

        delete filter.searchText;
    }
    // Các trường còn lại như serial, qrCode lọc trực tiếp
    const assetMaintenances = await AssetMaintenance.paginate(filter, {
        ...options,
        populate: [
            {
                path: 'assetModel',
                populate: [
                    {
                        path: 'manufacturer',
                        populate: [
                            {
                                path: 'origin',
                                select: 'originName',
                            },
                        ],
                    },
                    { path: 'subCategory' },
                    { path: 'category' },
                    { path: 'assetTypeCategory' },
                    { path: 'asset' },
                ],
            },
            { path: 'resource' },
            { path: 'customer' },
        ],
        lean: true,
    });
    return assetMaintenances;
};
/**
 * Get user by id
 * @param {ObjectId} id
 * @returns {Promise<User>}
 */
const getAssetMaintenanceById = async (id) => {
    return AssetMaintenance.findById(id).populate([
        {
            path: 'assetModel',
            populate: [
                {
                    path: 'asset',
                },
                { path: 'manufacturer' },
                { path: 'subCategory' },
                { path: 'category' },
                { path: 'assetTypeCategory' },
                { path: 'supplier' },
            ],
        },

        { path: 'resource' },
        {
            path: 'asset',
        },
        {
            path: 'customer',
        },
        {
            path: 'createdBy',
            populate: [
                {
                    path: 'company',
                },
            ],
        },
    ]);
};
const getAssetMaintenanceByIdNotPopulate = async (id) => {
    const assetMaintenance = await AssetMaintenance.findById(id);
    if (!assetMaintenance) {
        throw new ApiError(httpStatus.NOT_FOUND, 'AssetMaintenance not found');
    }
    return assetMaintenance;
};

const getAssetMaintenance = async (id) => {
    console.log('id', id);
    const assetMaintenance = await AssetMaintenance.findById(id).populate([
        {
            path: 'assetModel',
            populate: [
                {
                    path: 'asset',
                },
                { path: 'manufacturer' },
                { path: 'subCategory' },
                { path: 'category' },
                { path: 'assetTypeCategory' },
                { path: 'supplier' },
            ],
        },

        { path: 'resource' },
        {
            path: 'asset',
        },
        {
            path: 'customer',
        },
        {
            path: 'createdBy',
            populate: [
                {
                    path: 'company',
                },
            ],
        },
        {
            path: 'province',
        },
        {
            path: 'commune',
        },
        {
            path: 'branch',
        },
        {
            path: 'building',
        },
        {
            path: 'floor',
        },
        {
            path: 'department',
        },
    ]);
    return assetMaintenance;
};
const updateAssetMaintenanceById = async (id, updateBody) => {
    const assetMaintenance = await getAssetMaintenanceById(id);
    if (!assetMaintenance) {
        throw new ApiError(httpStatus.NOT_FOUND, 'AssetMaintenance not found');
    }
    if (updateBody && updateBody.assetNumber) {
        const countAssetMaintenance = await AssetMaintenance.countDocuments({
            assetNumber: updateBody.assetNumber,
            _id: { $ne: id },
        });
        if (countAssetMaintenance > 0) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Mã tài sản đã tồn tại');
        }
    }
    Object.assign(assetMaintenance, updateBody);
    await assetMaintenance.save();
    return assetMaintenance;
};
const updateStatus = async (id, updateBody) => {
    const assetMaintenance = await getAssetMaintenanceById(id);
    if (!assetMaintenance) {
        throw new ApiError(httpStatus.NOT_FOUND, 'AssetMaintenance not found');
    }
    Object.assign(assetMaintenance, updateBody);
    await assetMaintenance.save();
    return assetMaintenance;
};
const deleteAssetMaintenanceById = async (id) => {
    const assetMaintenance = await getAssetMaintenanceById(id);
    if (!assetMaintenance) {
        throw new ApiError(httpStatus.NOT_FOUND, 'AssetMaintenance not found');
    }

    await assetMaintenance.remove();
    return assetMaintenance;
};
const getAssetModelById = async (id) => {
    return AssetModel.findById(id);
};

const deleteAssetModelById = async (id) => {
    const assetModel = await getAssetModelById(id);
    if (!assetModel) {
        throw new ApiError(httpStatus.NOT_FOUND, 'assetModel not found');
    }
    await assetModel.remove();
    return assetModel;
};
const getAllAssetMaintenance = async () => {
    const assetMaintenances = await AssetMaintenance.find();
    return assetMaintenances;
};

const getAllDepreciationBase = async () => {
    const depreciationBase = await DepreciationBase.find();
    return depreciationBase;
};
const getAllDepreciationType = async () => {
    const depreciationType = await DepreciationType.find();
    return depreciationType;
};
const getAssetModelByRes = async (filter) => {
    if (!filter.asset) return [];
    const assetModels = await AssetModel.find(filter);
    return assetModels;
};
const getAssetModelByIdAssetMaintenance = async (id) => {
    const assetModel = await AssetModel.findOne({ assetMaintenanceId: id });
    return assetModel;
};
const getAllAssetModel = async () => {
    const assetModels = await AssetModel.find();
    return assetModels;
};
const getAssetMaintenanceByRes = async (filter) => {
    // Nếu filter có category hoặc manufacturer thì tìm AssetModel trước
    if (filter.category || filter.manufacturer || filter.assetStyle) {
        const assetFilter = {};
        if (filter.category) assetFilter.category = filter.category;
        if (filter.manufacturer) assetFilter.manufacturer = filter.manufacturer;
        const assets = await Asset.find(assetFilter).select('_id');
        const assetIds = assets.map((model) => model._id);
        if (filter.assetStyle) assetFilter.assetStyle = Number(filter.assetStyle); // Chuyển về Number
        // eslint-disable-next-line no-param-reassign
        filter.assetId = { $in: assetIds };
        // eslint-disable-next-line no-param-reassign
        delete filter.category;
        // eslint-disable-next-line no-param-reassign
        delete filter.manufacturer;
        // eslint-disable-next-line no-param-reassign
        delete filter.assetStyle;
    }
    const assetMaintenances = await AssetMaintenance.find(filter).populate([
        {
            path: 'assetModelId',
            select: 'assetModelName',
        },
        {
            path: 'assetId',
            select: 'assetName category manufacturer',
            populate: [
                { path: 'category', select: 'categoryName' },
                { path: 'manufacturer', select: 'manufacturerName' },
            ],
        },
        {
            path: 'customerId',
            select: 'customerName',
        },
    ]);

    return assetMaintenances;
};
const createAssetMaintenanceLocationHistory = async (data) => {
    return AssetMaintenanceLocationHistoryModel.create(data);
};
const getAssetMaintenanceLocationHistoryByRes = async (resquest) => {
    return AssetMaintenanceLocationHistoryModel.find(resquest)
        .populate([
            {
                path: 'assetMaintenance',
                populate: [{ path: 'customer' }, { path: 'updatedBy' }],
            },
            { path: 'province' },
            { path: 'commune' },
            { path: 'building' },
            { path: 'floor' },
            { path: 'department' },
            { path: 'branch' },
            { path: 'oldProvince' },
            { path: 'oldCommune' },
            { path: 'oldBuilding' },
            { path: 'oldFloor' },
            { path: 'oldDepartment' },
            { path: 'oldBranch' },
            { path: 'customer' },
            { path: 'oldCustomer' },
            { path: 'createdBy' },
            { path: 'resources' },
        ])
        .sort({ createdAt: -1 });
};
const calcularDowntimeOfAssetMaintenance = async (assetMaintenanceId, startDate, endDate) => {
    let totalTime = 0;
    const assetMaintenance = await AssetMaintenance.findById(assetMaintenanceId);
    if (!assetMaintenance) {
        throw new ApiError(httpStatus.NOT_FOUND, 'AssetMaintenance not found');
    }
    if (!startDate) return (totalTime = 0);
    const filter = {
        assetMaintenance: assetMaintenanceId,
        startDate: { $gte: new Date(startDate) }, //`${year}-12-31T23:59:59.999Z` lấy ngày hiện tại ( tính từ đầu năm đến hiện tại )
    };
    if (endDate) {
        filter.startDate.$lte = new Date(endDate);
    }
    const assetMaintenanceIsNotActiveHistorys = await AssetMaintenanceIsNotActiveHistoryModel.find(filter);
    for (const assetMaintenanceIsNotActiveHistory of assetMaintenanceIsNotActiveHistorys) {
        if (assetMaintenanceIsNotActiveHistory.endDate === null) {
            totalTime += new Date() - new Date(assetMaintenanceIsNotActiveHistory.startDate);
        } else {
            totalTime += assetMaintenanceIsNotActiveHistory.time;
        }
    }
    return totalTime;
};
const calcularDowntimeOfAssetMaintenanceShowStartEndTime = async (assetMaintenanceId, startDate, endDate, year) => {
    let totalTime = 0;
    const assetMaintenance = await AssetMaintenance.findById(assetMaintenanceId);
    if (!assetMaintenance) {
        throw new ApiError(httpStatus.NOT_FOUND, 'AssetMaintenance not found');
    }
    if (!startDate) return { time: 0, data: [] };

    const filter = {
        assetMaintenance: assetMaintenanceId,
        startDate: { $gte: new Date(startDate) },
    };

    if (endDate) {
        filter.startDate.$lte = new Date(endDate);
    }

    const histories = await AssetMaintenanceIsNotActiveHistoryModel.find(filter);
    const data = [];

    for (const history of histories) {
        let duration = 0;
        if (history.endDate === null) {
            duration = new Date() - new Date(history.startDate);
            history.endDate = new Date();
        } else {
            duration = history.time ?? new Date(history.endDate) - new Date(history.startDate);
        }

        totalTime += duration;
        data.push({
            ...history.toObject(),
            duration,
            year,
        });
    }

    return {
        time: totalTime,
        data,
    };
};
const calcularDowntimeOfAssetMaintenances = async (assetMaintenanceIds, startDate, endDate) => {
    let totalTime = 0;
    if (!startDate) return (totalTime = 0);
    const filter = {
        assetMaintenance: { $in: assetMaintenanceIds },
        startDate: { $gte: new Date(startDate) },
    };
    if (endDate) {
        filter.startDate.$lte = new Date(endDate);
    }
    const assetMaintenanceIsNotActiveHistorys = await AssetMaintenanceIsNotActiveHistoryModel.find(filter);
    for (const assetMaintenanceIsNotActiveHistory of assetMaintenanceIsNotActiveHistorys) {
        if (assetMaintenanceIsNotActiveHistory.endDate === null) {
            totalTime += new Date() - new Date(assetMaintenanceIsNotActiveHistory.startDate);
        } else {
            totalTime += assetMaintenanceIsNotActiveHistory.time;
        }
    }
    return totalTime;
};
// tổng thời gian chết của thiết bị
const totalEquipmentDowntime = async (assetMaintenanceId, year) => {
    let totalTime = 0;
    const assetMaintenance = await AssetMaintenance.findById(assetMaintenanceId);
    if (!assetMaintenance) {
        throw new ApiError(httpStatus.NOT_FOUND, 'AssetMaintenance not found');
    }
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date();
    totalTime = await calcularDowntimeOfAssetMaintenance(assetMaintenanceId, startDate, endDate);
    return totalTime;
};
const getAssetSummary = async (filter, req) => {
    const matchStage = {};
    // kiểm tra xem có được xem tất cả tài sản không
    let allowViewAll = true;
    if (req.companySetting.filterByAccount) {
        const dep = await Department.findById(req.user.department).select('allowViewAll');
        allowViewAll = dep?.allowViewAll;
    }
    if (!allowViewAll) {
        matchStage['assetMaintenance.department'] = mongoose.Types.ObjectId(req?.user?.department);
    }
    if (filter.branchs && Array.isArray(filter.branchs) && filter.branchs.length > 0) {
        matchStage['assetMaintenance.branch'] = { $in: filter.branchs.map((id) => mongoose.Types.ObjectId(id)) };
    }
    const now = new Date();
    now.setDate(now.getDate() + 2);
    const filterByDepartment = {
        $lookup: {
            from: 'assetmaintenances',
            localField: 'assetMaintenance',
            foreignField: '_id',
            as: 'assetMaintenance',
        },
    };
    const breakdown = await Breakdown.aggregate([
        {
            $match: {
                ticketStatus: { $in: [ticketBreakdownStatus.new, ticketBreakdownStatus.inProgress] },
            },
        },
        filterByDepartment,
        { $match: matchStage },
        {
            $group: { _id: '$assetMaintenance' },
        },
        {
            $count: 'totalAssets',
        },
    ]);

    const schedulePreventive = await SchedulePreventiveModel.aggregate([
        {
            $match: {
                ticketStatus: { $in: [ticketPreventiveStatus.new, ticketPreventiveStatus.inProgress] },
                startDate: { $lt: now },
            },
        },
        filterByDepartment,
        { $match: matchStage },
        { $group: { _id: '$assetMaintenance' } },
        { $count: 'totalAssets' },
    ]);
    const totalCalibration = await CalibrationWorkModel.aggregate([
        {
            $match: {
                groupStatus: { $in: [calibrationWorkGroupStatus.new, calibrationWorkGroupStatus.inProgress] },
                startDate: { $lt: now },
            },
        },
        filterByDepartment,
        { $match: matchStage },
        { $group: { _id: '$assetMaintenance' } },
        { $count: 'totalAssets' },
    ]);
    const assetFilter = {};
    if (!allowViewAll) {
        assetFilter.department = mongoose.Types.ObjectId(req?.user?.department);
    }
    if (filter.branchs && Array.isArray(filter.branchs) && filter.branchs.length > 0) {
        assetFilter.branch = { $in: filter.branchs.map((id) => mongoose.Types.ObjectId(id)) };
    }
    const total = await AssetMaintenance.countDocuments(assetFilter);
    return {
        breakdown: breakdown[0]?.totalAssets,
        schedulePreventive: schedulePreventive[0]?.totalAssets,
        totalCalibrationGroupByAssetMaintenance: totalCalibration[0]?.totalAssets,
        total,
    };
};
const getDowntimeBreakdownAssetMaintenanceByRes = async (assetMaintenanceIds, startDate, endDate) => {
    const breakdowns = await Breakdown.find({
        assetMaintenance: { $in: assetMaintenanceIds },
        createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
    });
    let downtime = await breakdownService.workingTimeBreakdowns(breakdowns.map((b) => b._id));
    return downtime;
};
const getCurrentAssetNumber = async (company, asset, serial, fundingSources) => {
    const assetNumber = await sequenceService.generateCurrentAssetNumber(company, asset, serial, fundingSources);
    return assetNumber;
};
const getAssetMaintenanceDueInspections = async (companyId, options, filters = {}) => {
    const notificationSetting = await NotificationSettingModel.findOne({ company: companyId });

    let nextInspectionDate;
    if (filters.nextInspectionDate) {
        if (
            new Date(filters.nextInspectionDate) < new Date().setHours(0, 0, 0, 0) ||
            new Date(filters.nextInspectionDate) >
            new Date(
                new Date().setDate(new Date().getDate() + (notificationSetting?.preInspectionNotificationDays || 0))
            )
        ) {
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                `Ngày tìm kiếm phải trong khoảng từ hôm nay đến ${new Date(
                    new Date().setDate(new Date().getDate() + (notificationSetting?.preInspectionNotificationDays || 0))
                ).toLocaleDateString()} ! `
            );
        }
        nextInspectionDate = {
            $gte: new Date(filters.nextInspectionDate),
            $lte: new Date(filters.nextInspectionDate),
        };
        delete filters.nextInspectionDate;
    } else {
        nextInspectionDate = {
            $gte: new Date(new Date().setHours(0, 0, 0, 0)),
            $lte: new Date(
                new Date().setDate(new Date().getDate() + (notificationSetting?.preInspectionNotificationDays || 0))
            ),
        };
    }
    const assetMaintenances = await AssetMaintenance.paginate(
        {
            nextInspectionDate,
            ...filters,
        },
        { ...options, populate: ['asset', 'assetModel', 'customer'] }
    );
    return assetMaintenances;
};

const updateData = async () => {
    const [assetMaintenance, assetModels, assets, assetTypes, categories, manufacturers, subCategories, customers] =
        await Promise.all([
            AssetMaintenance.find(),
            AssetModel.find(),
            Asset.find(),
            AssetTypeCategoryModel.find(),
            Category.find(),
            Manufacturer.find(),
            SubCategory.find(),
            Customer.find(),
        ]);

    const mapAssetModel = new Map(assetModels.map((x) => [String(x._id), x]));
    const mapAsset = new Map(assets.map((x) => [String(x._id), x]));
    const mapAssetType = new Map(assetTypes.map((x) => [String(x._id), x]));
    const mapCategory = new Map(categories.map((x) => [String(x._id), x]));
    const mapManufacturer = new Map(manufacturers.map((x) => [String(x._id), x]));
    const mapSubCategory = new Map(subCategories.map((x) => [String(x._id), x]));
    const mapCustomer = new Map(customers.map((x) => [String(x._id), x]));

    const bulk = [];

    for (const a of assetMaintenance) {
        const dataUpdate = {};

        // assetModel
        const assetModel = mapAssetModel.get(String(a.assetModel));
        if (assetModel) {
            dataUpdate.assetModelName = assetModel.assetModelName;

            const asset = mapAsset.get(String(assetModel.asset));
            if (asset) dataUpdate.assetName = asset.assetName;

            const type = mapAssetType.get(String(assetModel.assetTypeCategory));
            if (type) dataUpdate.assetTypeCategory = type.name;

            const cat = mapCategory.get(String(assetModel.category));
            if (cat) dataUpdate.categoryName = cat.categoryName;

            const manu = mapManufacturer.get(String(assetModel.manufacturer));
            if (manu) dataUpdate.manufacturerName = manu.manufacturerName;

            const sub = mapSubCategory.get(String(assetModel.subCategory));
            if (sub) dataUpdate.subCategoryName = sub.subCategoryName;
        }

        // customer
        const cus = mapCustomer.get(String(a.customer));
        if (cus) dataUpdate.customerName = cus.customerName;

        // bulk update
        bulk.push({
            updateOne: {
                filter: { _id: a._id },
                update: { $set: dataUpdate },
            },
        });
    }

    if (bulk.length > 0) {
        await AssetMaintenance.bulkWrite(bulk, { ordered: false });
    }
};

const getAssetMaintenanceMobile = async (filter, options) => {
    const assetMaintenances = await AssetMaintenance.paginate(filter, {
        ...options,
        populate: [{ path: 'resource' }],
    });

    return assetMaintenances;
};

const createHistoryAssetMaintenanceSparePart = async (data) => {
    return HistoryAssetMaintenanceSparePartModel.create(data);
};
const deleteHistoryAssetMaintenanceSparePartByRes = async (data) => {
    return HistoryAssetMaintenanceSparePartModel.deleteMany(data);
};
const lastHistoryAssetMaintenanceSparePart = async (filter) => {
    return HistoryAssetMaintenanceSparePartModel.findOne(filter).sort({ replacementDate: -1 });
};
const updateAssetIdOneQA = async (assetIdOneQA, model, serialNumber) => {
    const existed = await AssetMaintenance.exists({ assetIdOneQA });
    if (existed) return;

    // Chỉ update record CHƯA có assetIdOneQA
    await AssetMaintenance.findOneAndUpdate(
        {
            assetModelName: model,
            serial: serialNumber,
            assetIdOneQA: { $exists: false },
        },
        {
            $set: { assetIdOneQA },
        }
    );
};
const checkForDuplicates = async (company, asset, fundingSources, assetNumber, serial, assetMaintenanceId) => {
    const newAssetNumber = await sequenceService.generateCurrentAssetNumberBySequense(company, asset, fundingSources);
    if (serial && serial !== assetNumber.split('.').pop()) {
        return {
            isDuplicate: true,
            message: 'Số serial đã sinh ra không đúng mã tài sản. Vui lòng nhập lại',
        };
    }
    //  const filter = { assetNumber: assetNumber };
    // if (assetMaintenanceId) {
    //     filter._id = { $ne: assetMaintenanceId };
    // }
    const count = await AssetMaintenance.countDocuments({ assetNumber: assetNumber, _id: { $ne: assetMaintenanceId } });
    if (count > 0) {
        await sequenceService.saveCurrentAssetNumber();
        return {
            isDuplicate: true,
            assetNumber: newAssetNumber,
            message: 'Mã tài sản này đã được sử dụng, đã gợi ý tăng mã tài sản lên tránh trùng lặp',
        };
    }
    return {
        isDuplicate: false,
    };
};
const checkForDuplicatesUpdate = async (company, asset, fundingSources, assetNumber, serial, assetMaintenanceId) => {
    const newAssetNumber = await sequenceService.generateCurrentAssetNumberBySequense(company, asset, fundingSources);
    if (serial && serial !== assetNumber.split('.').pop()) {
        return {
            isDuplicate: true,
            message: 'Số serial đã sinh ra không đúng mã tài sản. Vui lòng nhập lại',
        };
    }
    const count = await AssetMaintenance.countDocuments({ assetNumber: assetNumber, _id: { $ne: assetMaintenanceId } });
    if (count > 0) {
        if (!serial) {
            await sequenceService.saveCurrentAssetNumber();
            return {
                isDuplicate: true,
                assetNumber: newAssetNumber,
                message: 'Mã tài sản này đã được sử dụng, đã gợi ý tăng mã tài sản lên tránh trùng lặp',
            };
        }
        return {
            isDuplicate: true,
            message: 'Mã tài sản này đã được sử dụng',
        };
    }
    return {
        isDuplicate: false,
    };
};
const getAssetMaintenanceChecklistByRes = async (filter) => {
    const assetMaintenaceChecklists = await AssetMaintenanceChecklistModel.find(filter);
    return assetMaintenaceChecklists;
};
const updateAssetMaintenanceChecklistByAssetMaintenance = async (id, updateBody) => {
    const assetMaintenanceChecklists = await AssetMaintenanceChecklistModel.find({ assetMaintenance: id });
    if (assetMaintenanceChecklists.length > 0) {
        await AssetMaintenanceChecklistModel.deleteMany({ assetMaintenance: id });
    }
    const newChecklists = updateBody.map((checklist) => ({
        ...checklist,
        assetMaintenance: id,
    }));
    return AssetMaintenanceChecklistModel.insertMany(newChecklists);
};
const updateLocationForWorkNotStarted = async (amId, newData) => {
    const resultCW = await CalibrationWorkModel.updateMany(
        {
            assetMaintenance: amId,
            startDate: { $gt: new Date() },
        },
        {
            $set: {
                province: newData.province,
                commune: newData.commune,
                branch: newData.branch,
                building: newData.building,
                floor: newData.floor,
                department: newData.department,
                addressNote: newData.addressNote,
            },
        }
    );
    const resultSC = await SchedulePreventiveModel.updateMany(
        {
            assetMaintenance: amId,
            startDate: { $gt: new Date() },
        },
        {
            $set: {
                province: newData.province,
                commune: newData.commune,
                branch: newData.branch,
                building: newData.building,
                floor: newData.floor,
                department: newData.department,
                addressNote: newData.addressNote,
            },
        }
    );
    return {
        resultCW,
        resultSC,
    };
};

const requestCancelAsset = async (id, resson, fileList) => {
    const assetMaintenance = await AssetMaintenance.findOneAndUpdate(
        {
            _id: id,
            assetStatus: { $in: [assetStatus.ACTIVE, assetStatus.PAUSED] }
        },
        {
            $set: { assetStatus: assetStatus.PENDING_CANCEL, cancelReason: resson },
        }
    );

    if (!assetMaintenance) {
        throw new Error('Tài sản không tồn tại hoặc trạng thái không phù hợp');
    }

    // upload file
    await AssetMaintenanceDocument.insertMany(
        fileList.map(file => ({
            assetMaintenance: id,
            resource: file,
            fileType: assetMaintenanceDocumentFileType.ASSET_CANCEL,
            documentCategory: assetMaintenanceDocumentFileType.ASSET_CANCEL
        }))
    );


    return assetMaintenance;
};

const approveCancelAsset = async (id) => {
    // update trạng thái lên chờ thanh lý
    const assetMaintenance = await AssetMaintenance.findOneAndUpdate(
        {
            _id: id,
            assetStatus: assetStatus.PENDING_CANCEL,
        },
        {
            $set: { assetStatus: assetStatus.PENDING_DISPOSAL },
        }
    );

    if (!assetMaintenance) {
        throw new Error('Tài sản không tồn tại hoặc trạng thái không phù hợp');
    }

    // xử lý phần tạo phiếu xuâts kho thanh lý

    return assetMaintenance;
};
const checkAssetStyleNotAccessories = async (assetMaintenanceId) => {
    if (!assetMaintenanceId) return;
    const assetMaintenance = await AssetMaintenance.findById(assetMaintenanceId).select('assetStyle').lean();
    if (!assetMaintenance) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy tài sản');
    }
    if (assetMaintenance.assetStyle === assetStyle.accessories) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Không thể tạo công việc cho thiết bị phụ');
    }
};
const checkAssetMaintenanceNotWithAssetStatus = async (assetMaintenanceId) => {
    if (!assetMaintenanceId) return;
    const assetMaintenance = await AssetMaintenance.findById(assetMaintenanceId).lean();
    if (!assetMaintenance) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Không tìm thấy tài sản');
    }
    if (assetMaintenance.assetStatus === assetStatus.PENDING_DISPOSAL) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Tài sản đang chờ thanh lý không thể tạo công việc');
    }
};
const mapPropertyAccessoriesWithAssetMaintenance = async (assetMaintenanceId, listPropertyAccessories) => {
    if (!assetMaintenanceId) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Chưa truyền tài sản chính vào');
    }
    const assetMaintenance = await AssetMaintenance.findById(assetMaintenanceId);
    if (!assetMaintenance) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Tài sản chính không tồn tại');
    }
    if (listPropertyAccessories.length === 0) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Vui lòng chọn tài sản');
    }
    for (const item of listPropertyAccessories) {
        await AssetMaintenance.updateOne({ _id: item }, { parentId: assetMaintenanceId });
    }
    return assetMaintenance;
};
const getPropertyAccessoriesByAssetMaintenance = async (mainAssetsId) => {
    const propertyAccessories = await AssetMaintenance.find({ parentId: mainAssetsId })
        .populate([
            {
                path: 'assetModel',
                populate: [
                    { path: 'manufacturer' },
                    { path: 'subCategory' },
                    { path: 'category' },
                    { path: 'assetTypeCategory' },
                    { path: 'asset' },
                    { path: 'supplier' },
                ],
            },
            { path: 'resource' },
            { path: 'customer' },
            { path: 'branch' },
            { path: 'building' },
            { path: 'floor' },
            { path: 'department' },
            { path: 'commune' },
        ])
        .sort({ createdAt: -1 });
    return propertyAccessories;
};
const deleteParentIdInPropertyAccessories = async (id) => {
    const assetMaintenance = await AssetMaintenance.findById(id);
    if (!assetMaintenance) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Tài sản phụ này không tồn tại');
    }
    assetMaintenance.parentId = null;
    await assetMaintenance.save();
    return assetMaintenance;
};
const updatePauseAsset = async (id, userId, origin) => {

    // thiết bị dừng hoạt động khi bắt đầu 1 sự cố, kỹ sư đầu tiên đăng nhập vào công việc bảo trì, hiệu chuẩn
    const assetMaintenance = await AssetMaintenance.findOneAndUpdate(
        {
            _id: id,
            assetStatus: { $nin: [assetStatus.PENDING_DISPOSAL, assetStatus.PAUSED] },
        },
        {
            $set: { assetStatus: assetStatus.PAUSED },
        }
    );
    if (!assetMaintenance) {
        // throw new Error("Tài sản không tồn tại hoặc trạng thái không phù hợp");
        console.log('trạng thái không phù hợp');
        return;
    }

    // tính downtime
    const history = await AssetMaintenanceIsNotActiveHistoryModel.find({ assetMaintenance: id, endDate: null });
    if (history.length < 1) {
        await AssetMaintenanceIsNotActiveHistoryModel.create({
            assetMaintenance: id,
            startDate: Date.now(),
            createdBy: userId,
            origin: origin,
        })
    }

};

const updateActiveAsset = async (id, userId, origin, work) => {
    console.log(id, userId, origin)
    const countDocuments = await getConutTaskAssetMaintenance(id)

    if (countDocuments > 0) {
        console.log('Vẫn còn công việc chưa hoàn thành');
        return;
    }

    const assetMaintenance = await AssetMaintenance.findOneAndUpdate(
        {
            _id: id,
        },
        {
            $set: { assetStatus: assetStatus.ACTIVE },
        }
    );

    if (!assetMaintenance) {
        console.log('trạng thái không phù hợp');
        return null;
    }

    const history = await AssetMaintenanceIsNotActiveHistoryModel.findOne({
        assetMaintenance: id,
        endDate: null,
    });

    // trường hợp huỷ hoặc xoá đi sự cố check xem sự cố đó đã về trạng thái huỷ hoặc đã bị xoá chưa nếu rồi thì xoá bản ghi lịch sử breakdown đi 
    if (origin && work === workAsset.breakdown) {
        const breakdown = await Breakdown.findById(origin)
        if (!breakdown || breakdown.status === progressStatus.cancelled) {
            await AssetMaintenanceIsNotActiveHistoryModel.findOneAndDelete(
                { assetMaintenance: id, endDate: null },
            );
            return assetMaintenance;
        }

    }

    // hoàn thành trên web lấy thời gian bắt đầu bằng startdate sớm nhất
    if (origin && work === workAsset.schedulePreventive && !history) {

        const schedulePreventiveTaskIds = await SchedulePreventiveTask
            .find({ schedulePreventive: origin })
            .distinct('_id');
        const firstCheckinCheckoutPreventive = await SchedulePreventiveCheckInCheckOut
            .findOne({
                schedulePreventiveTask: { $in: schedulePreventiveTaskIds }
            })
            .sort({ checkInDateTime: 1 });
        if (firstCheckinCheckoutPreventive) {
            const checkInTime = firstCheckinCheckoutPreventive?.checkInDateTime;
            await AssetMaintenanceIsNotActiveHistoryModel.create({
                assetMaintenance: id,
                startDate: checkInTime,
                endDate: Date.now(),
                createdBy: userId,
                origin: origin,
                time: Date.now() - checkInTime,
            });

            return null;
        }

    }


    // hoàn thành trên web lấy thời gian bắt đầu bằng startdate sớm nhất
    if (origin && work === workAsset.calibrationWork && !history) {

        const firstCheckinCheckoutCalibration = await CalibrationWorkCheckinCheckOut
            .findOne({ calibrationWork: origin })
            .sort({ checkInDateTime: 1 });
        if (firstCheckinCheckoutCalibration) {
            const checkInTime = firstCheckinCheckoutCalibration?.checkInDateTime;
            await AssetMaintenanceIsNotActiveHistoryModel.create({
                assetMaintenance: id,
                startDate: checkInTime,
                endDate: Date.now(),
                createdBy: userId,
                origin: origin,
                time: Date.now() - checkInTime,
            });
            return null;
        }

    }

    // còn lại có startdate 
    if (history) {
        const now = Date.now();
        await AssetMaintenanceIsNotActiveHistoryModel.updateOne(
            { _id: history._id },
            {
                endDate: now,
                time: now - history.startDate,
                updatedBy: userId,
            }
        );
    }

    return assetMaintenance;
};

const updateAssetStatus = async (id) => {
    let query = {};

    if (id) {
        query = {
            _id: id,
            $or: [
                { assetStatus: { $in: [assetStatus.PENDING_CANCEL, assetStatus.PENDING_DISPOSAL, assetStatus.PENDING_RETURN] } },
            ],
        };
    } else {
        query = {
            $or: [
                { assetStatus: { $in: [assetStatus.ACTIVE, assetStatus.PAUSED] } },
                { assetStatus: null },
                { assetStatus: { $exists: false } }
            ]
        }
    }

    const assets = await AssetMaintenance.find(query);

    for (const asset of assets) {
        const id = asset._id;

        const countDocuments = await getConutTaskAssetMaintenance(id)

        if (countDocuments > 0) {
            if (asset.assetStatus !== assetStatus.PAUSED) {
                await AssetMaintenance.updateOne({ _id: id }, { $set: { assetStatus: assetStatus.PAUSED } });
            }
        } else {
            if (asset.assetStatus !== assetStatus.ACTIVE) {
                await AssetMaintenance.updateOne({ _id: id }, { $set: { assetStatus: assetStatus.ACTIVE } });
            }
        }

        // update lại thông tin vị trí 
        const locationAssetMaintenance = await AssetMaintenanceLocationHistoryModel.findOne({ assetMaintenance: id }).sort({ createdAt: -1 });
        if (locationAssetMaintenance) {
            await AssetMaintenance.findByIdAndUpdate(id, {
                commune: locationAssetMaintenance?.commune,
                province: locationAssetMaintenance?.province,
                building: locationAssetMaintenance?.building,
                floor: locationAssetMaintenance?.floor,
                department: locationAssetMaintenance?.department,
                branch: locationAssetMaintenance?.branch,
                addressNote: locationAssetMaintenance?.addressNote,
            });
        }
    }

};
const getConutTaskAssetMaintenance = async (assetMaintenanceId) => {
    const [totalBreakdown, totalSchedulePreventive, totalCalibrationWork] = await Promise.all([
        Breakdown.countDocuments({
            assetMaintenance: assetMaintenanceId,
            status: {
                $in: [
                    breakdownStatus.new,
                    breakdownStatus.assigned,
                    breakdownStatus.accepted,
                    breakdownStatus.rejected,
                    breakdownStatus.inProgress,
                    breakdownStatus.replacement,
                    breakdownStatus.experimentalFix,
                    breakdownStatus.reopen,
                    breakdownStatus.submitted,
                ],
            },
        }),

        SchedulePreventiveModel.countDocuments({
            assetMaintenance: assetMaintenanceId,
            status: {
                $in: [
                    schedulePreventiveStatus.inProgress,
                    schedulePreventiveStatus.waitingForAdminApproval,
                    schedulePreventiveStatus.submitted,
                ],
            },
        }),

        CalibrationWorkModel.countDocuments({
            assetMaintenance: assetMaintenanceId,
            status: {
                $in: [
                    calibrationWorkStatus.inProgress,
                    calibrationWorkStatus.waitingForAdminApproval,
                    calibrationWorkStatus.reOpen,
                ],
            },
        }),
    ]);

    return totalBreakdown + totalSchedulePreventive + totalCalibrationWork;
};


const requestReturnAsset = async (id, resson, fileList) => {
    const assetMaintenance = await AssetMaintenance.findOneAndUpdate(
        {
            _id: id,
            assetStatus: { $in: [assetStatus.ACTIVE, assetStatus.PAUSED] }
        },
        {
            $set: {
                assetStatus: assetStatus.PENDING_RETURN,
                returnReason: resson,
            }
        },
    );

    if (!assetMaintenance) {
        throw new Error('Tài sản không tồn tại hoặc trạng thái không phù hợp');
    }

    // upload file
    await AssetMaintenanceDocument.insertMany(
        fileList.map(file => ({
            assetMaintenance: id,
            resource: file,
            fileType: assetMaintenanceDocumentFileType.ASSET_RETURN,
            documentCategory: assetMaintenanceDocumentFileType.ASSET_RETURN
        }))
    );


    return assetMaintenance;
};

const approveReturnAsset = async (id) => {
    const assetMaintenance = await AssetMaintenance.findOneAndUpdate(
        {
            _id: id,
            assetStatus: assetStatus.PENDING_RETURN,
        },
        {
            $set: {
                assetStatus: assetStatus.RETURNED,
                address: null,
                department: null,
                branch: null,
                floor: null,
                building: null,
                province: null,
                commune: null
            },
        }
    );

    if (!assetMaintenance) {
        throw new Error('Tài sản không tồn tại hoặc trạng thái không phù hợp');
    }


    return assetMaintenance;
};

const disposalAsset = async (id, fileList) => {
    const assetMaintenance = await AssetMaintenance.findOneAndUpdate(
        { _id: id, assetStatus: assetStatus.PENDING_DISPOSAL },
        {
            $set: {
                assetStatus: assetStatus.DISPOSAL
            }
        }
    );

    if (!assetMaintenance) {
        throw new Error('Tài sản không tồn tại hoặc trạng thái không phù hợp');
    }

    await AssetMaintenanceDocument.insertMany(
        fileList.map(file => ({
            assetMaintenance: id,
            resource: file,
            fileType: assetMaintenanceDocumentFileType.DISPOSAL,
            documentCategory: assetMaintenanceDocumentFileType.DISPOSAL,
        }))
    );


    // xuất kho thanh lý
    // tạo phiếu xuất kho approved luôn
    // const stockIssue = {

    // },

    // const stockIssueDetail = {

    // },

    // const stockMove = {

    // },

    // const stockMoveLine = {

    // },




}
module.exports = {
    queryAssetMaintenances,
    getAssetMaintenanceById,
    updateAssetMaintenanceById,
    deleteAssetMaintenanceById,
    createAssetMaintenance,
    updateStatus,
    getAllAssetMaintenance,
    getAllDepreciationBase,
    getAllDepreciationType,
    getAssetModelByRes,
    createAssetModel,
    getAssetModelByIdAssetMaintenance,
    deleteAssetModelById,
    getAssetModelById,
    getAssetMaintenanceByData,
    getAssetMaintenanceByQrCode,
    getAssetModelByName,
    getAllAssetModel,
    getAssetMaintenanceByRes,
    getAssetMaintenance,
    createAssetMaintenanceLocationHistory,
    getAssetMaintenanceLocationHistoryByRes,
    totalEquipmentDowntime,
    getAssetSummary,
    getAssetMaintenanceByIdNotPopulate,
    getDowntimeBreakdownAssetMaintenanceByRes,
    getAssetMaintenanceDueInspections,
    calcularDowntimeOfAssetMaintenance,
    calcularDowntimeOfAssetMaintenances,
    calcularDowntimeOfAssetMaintenanceShowStartEndTime,
    updateData,
    getAssetMaintenanceMobile,
    createHistoryAssetMaintenanceSparePart,
    deleteHistoryAssetMaintenanceSparePartByRes,
    lastHistoryAssetMaintenanceSparePart,
    updateAssetIdOneQA,
    getCurrentAssetNumber,
    checkForDuplicates,
    checkForDuplicatesUpdate,
    // updateAssetIdOneQA
    getAssetMaintenanceChecklistByRes,
    updateAssetMaintenanceChecklistByAssetMaintenance,
    updateLocationForWorkNotStarted,
    requestCancelAsset,
    approveCancelAsset,
    checkAssetStyleNotAccessories,
    mapPropertyAccessoriesWithAssetMaintenance,
    getPropertyAccessoriesByAssetMaintenance,
    deleteParentIdInPropertyAccessories,
    updatePauseAsset,
    updateActiveAsset,
    updateAssetStatus,
    checkAssetMaintenanceNotWithAssetStatus,
    getConutTaskAssetMaintenance,
    requestReturnAsset,
    approveReturnAsset,
    disposalAsset
};
