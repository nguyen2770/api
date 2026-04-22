const httpStatus = require('http-status');
const mongoose = require('mongoose');
const {
    Breakdown,
    BreakdownDefect,
    AssetMaintenance,
    BreakdownCommentModel,
    BreakdownAttachmentModel,
    BreakdownAssignUserModel,
    BreakdownAttachmentCloseModel,
    BreakdownHistoryModel,
    SchedulePreventiveTaskItemModel,
    SchedulePreventiveTaskModel,
    SchedulePreventiveTaskAssignUserModel,
    BreakdownAssignUserCheckinCheckOutModel,
    AssetMaintenanceIsNotActiveHistoryModel,
    CalibrationWorkAssignUserModel,
    CalibrationModel,
    CalibrationWorkModel,
    BreakdownAssignUserRepairModel,
    BreakdownAssignUserAttachmentModel,
    PropertyInspectionModel,
    AssetMaintenanceUserModel,
    Department,
} = require('../../models');
const ApiError = require('../../utils/ApiError');
const {
    breakdownAssignUserStatus,
    progressStatus,
    ticketBreakdownStatus,
    schedulePreventiveTaskAssignUserStatus,
    assetMaintenanceStatus,
    calibrationWorkAssignUserStatus,
    notificationTypeCode,
    propertyInspectionStatus,
} = require('../../utils/constant');
const schedulePreventiveService = require('../preventive/schedulePreventive.service');
const notificationService = require('../notification/notification.service');

/**
 * Create a user
 * @param {Object} data
 * @returns {Promise<User>}
 */
const createBreakdown = async (data) => {
    const assetMaintenanceService = require('./assetMaintenance.service');
    await assetMaintenanceService.checkAssetStyleNotAccessories(data?.assetMaintenance);
    await assetMaintenanceService.checkAssetMaintenanceNotWithAssetStatus(data?.assetMaintenance);
    const _assetMaintenance = await AssetMaintenance.findById(data?.assetMaintenance);
    const newData = {
        ...data,
        province: _assetMaintenance?.province,
        commune: _assetMaintenance?.commune,
        branch: _assetMaintenance?.branch,
        building: _assetMaintenance?.building,
        floor: _assetMaintenance?.floor,
        department: _assetMaintenance?.department,
        addressNote: _assetMaintenance?.addressNote,
    };
    const breakdown = await Breakdown.create(newData);
    if (breakdown) {
        if (breakdown.assetMaintenanceStatus === assetMaintenanceStatus.isNotActive) {
            await assetMaintenanceService.updatePauseAsset(breakdown.assetMaintenance, breakdown.createdBy, breakdown._id);
        }
    }
    return breakdown;
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

const queryBreakdowns = async (filter, options, _assetMaintenanceFilter, req) => {
    console.log('options', options);
    const breakdownFilter = filter;

    if (filter.code) {
        breakdownFilter.code = { $regex: filter.code, $options: 'i' };
    }
    if (filter.breakdownIds) {
        breakdownFilter._id = {
            $in: filter.breakdownIds,
        };
        // delete filter.breakdownIds;
    }
    if (filter.breakdownStatus) {
        breakdownFilter.status = filter.breakdownStatus;
        delete filter.breakdownStatus;
    }
    if (filter.ticketStatuses) {
        breakdownFilter.ticketStatus = {
            $in: filter.ticketStatuses,
        };
    }
    // check cho phần quá hạn
    if (filter.isOverdue) {
        breakdownFilter.incidentDeadline = { $lt: new Date() };
    }

    delete breakdownFilter.breakdownIds;
    delete breakdownFilter.isOverdue;
    delete breakdownFilter.ticketStatuses;
    const moreFilter = {};
    // kiểm tra xem có được xem tất cả tài sản không
    let allowViewAll = true;
    if (req.companySetting.filterByAccount) {
        const dep = await Department.findById(req.user.department).select('allowViewAll');
        allowViewAll = dep?.allowViewAll;
    }
    if (!allowViewAll) {
        moreFilter['assetMaintenance.department'] = mongoose.Types.ObjectId(req?.user?.department);
    }
    if (filter.searchText) {
        const text = filter.searchText;

        const regex = { $regex: text, $options: 'i' };

        moreFilter.$or = [
            { code: regex },
            { 'assetMaintenance.serial': regex },
            { 'asset.assetName': regex },
            { 'assetModel.assetModelName': regex },
        ];

        delete filter.searchText;
    }

    if (_assetMaintenanceFilter.assetStyles && _assetMaintenanceFilter.assetStyles.length > 0) {
        moreFilter['assetMaintenances.assetStyle'] = {
            $in: _assetMaintenanceFilter.assetStyles,
        };
    }
    if (filter.assetName) {
        moreFilter['asset.assetName'] = {
            $regex: filter.assetName,
            $options: 'i',
        };
        delete filter.assetName;
    }
    if (filter.assetModelName) {
        moreFilter['assetModel.assetModelName'] = {
            $regex: filter.assetModelName,
            $options: 'i',
        };
        delete filter.assetModelName;
    }

    if (filter.serial) {
        moreFilter['assetMaintenance.serial'] = {
            $regex: filter.serial,
            $options: 'i',
        };
        delete filter.serial;
    }
    if (filter.assetStyle) {
        moreFilter['assetMaintenance.assetStyle'] = filter.assetStyle;
        delete filter.assetStyle;
    }
    if (_assetMaintenanceFilter.priorityLevels && _assetMaintenanceFilter.priorityLevels.length > 0) {
        moreFilter.priorityLevel = { $in: _assetMaintenanceFilter.priorityLevels };
    }
    if (_assetMaintenanceFilter.startDate && _assetMaintenanceFilter.endDate) {
        moreFilter.incidentDeadline = {
            $gte: new Date(_assetMaintenanceFilter.startDate),
            $lte: new Date(_assetMaintenanceFilter.endDate),
        };
    }
    if (_assetMaintenanceFilter.branchs && _assetMaintenanceFilter.branchs.length > -1) {
        const _branchs = _assetMaintenanceFilter.branchs.map((_b) => mongoose.Types.ObjectId(_b));
        moreFilter['assetMaintenances.branch'] = {
            $in: _branchs,
        };
    }
    // if (_assetMaintenanceFilter.breakdownAssignUserStatuses && _assetMaintenanceFilter.breakdownAssignUserStatuses.length > 0) {
    //     const breakdownAssignUsers = await BreakdownAssignUserModel.find({
    //         status: { $in: _assetMaintenanceFilter.breakdownAssignUserStatuses }
    //     });
    //     const breakdownIds = breakdownAssignUsers.map(item => item.breakdown);
    //     moreFilter._id = { $in: breakdownIds };
    // }
    if (_assetMaintenanceFilter.customers && _assetMaintenanceFilter.customers.length > 0) {
        moreFilter['assetMaintenances.customer'] = {
            $in: _assetMaintenanceFilter.customers.map((_) => {
                return mongoose.Types.ObjectId(_);
            }),
        };
    }
    if (_assetMaintenanceFilter.assetModels && _assetMaintenanceFilter.assetModels.length > 0) {
        moreFilter['assetmodels._id'] = {
            $in: _assetMaintenanceFilter.assetModels.map((_) => {
                return mongoose.Types.ObjectId(_);
            }),
        };
    }
    if (_assetMaintenanceFilter.assetMaintenances && _assetMaintenanceFilter.assetMaintenances.length > 0) {
        moreFilter['assetMaintenances._id'] = {
            $in: _assetMaintenanceFilter.assetMaintenances.map((_) => {
                return mongoose.Types.ObjectId(_);
            }),
        };
    }
    if (_assetMaintenanceFilter.serviceCategorys && _assetMaintenanceFilter.serviceCategorys.length > 0) {
        moreFilter['servicecategories._id'] = {
            $in: _assetMaintenanceFilter.serviceCategorys.map((_) => {
                return mongoose.Types.ObjectId(_);
            }),
        };
    }
    if (_assetMaintenanceFilter.subServiceCategorys && _assetMaintenanceFilter.subServiceCategorys.length > 0) {
        moreFilter['servicesubcategories._id'] = {
            $in: _assetMaintenanceFilter.subServiceCategorys.map((_) => {
                return mongoose.Types.ObjectId(_);
            }),
        };
    }
    if (_assetMaintenanceFilter.categorys && _assetMaintenanceFilter.categorys.length > 0) {
        moreFilter['categories._id'] = {
            $in: _assetMaintenanceFilter.categorys.map((_) => {
                return mongoose.Types.ObjectId(_);
            }),
        };
    }
    if (_assetMaintenanceFilter.assets && _assetMaintenanceFilter.assets.length > 0) {
        moreFilter['assets._id'] = {
            $in: _assetMaintenanceFilter.assets.map((_) => {
                return mongoose.Types.ObjectId(_);
            }),
        };
    }
    if (_assetMaintenanceFilter.manufacturers && _assetMaintenanceFilter.manufacturers.length > 0) {
        moreFilter['manufacturers._id'] = {
            $in: _assetMaintenanceFilter.manufacturers.map((_) => {
                return mongoose.Types.ObjectId(_);
            }),
        };
    }
    const searchAggregaates = [
        {
            $match: breakdownFilter,
        },
        {
            $lookup: {
                from: 'servicecategories',
                localField: 'serviceCategory',
                foreignField: '_id',
                as: 'servicecategories',
            },
        },
        {
            $lookup: {
                from: 'servicesubcategories',
                localField: 'subServiceCategory',
                foreignField: '_id',
                as: 'servicesubcategories',
            },
        },
        {
            $lookup: {
                from: 'assetmaintenances',
                localField: 'assetMaintenance',
                foreignField: '_id',
                as: 'assetMaintenances',
            },
        },
        {
            $lookup: {
                from: 'assets',
                localField: 'assetMaintenances.asset',
                foreignField: '_id',
                as: 'asset',
            },
        },
        {
            $lookup: {
                from: 'assetmodels',
                localField: 'assetMaintenances.assetModel',
                foreignField: '_id',
                as: 'assetModel',
            },
        },
        {
            $lookup: {
                from: 'assetmaintenances',
                localField: 'assetMaintenance',
                foreignField: '_id',
                as: 'assetMaintenance',
            },
        },
        {
            $lookup: {
                from: 'branches',
                localField: 'assetMaintenances.branch',
                foreignField: '_id',
                as: 'objectBranch',
            },
        },
        { $unwind: { path: '$objectBranch', preserveNullAndEmptyArrays: true } },
        { $unwind: { path: '$assetMaintenance', preserveNullAndEmptyArrays: true } },
        { $unwind: { path: '$asset', preserveNullAndEmptyArrays: true } },
        { $unwind: { path: '$assetModel', preserveNullAndEmptyArrays: true } },
        // { $match: moreFilter },
        {
            $lookup: {
                from: 'categories',
                localField: 'assetmodels.category',
                foreignField: '_id',
                as: 'categories',
            },
        },
        {
            $lookup: {
                from: 'manufacturers',
                localField: 'assetmodels.manufacturer',
                foreignField: '_id',
                as: 'manufacturers',
            },
        },
        {
            $lookup: {
                from: 'customers',
                localField: 'assetMaintenances.customer',
                foreignField: '_id',
                as: 'customers',
            },
        },
        { $match: moreFilter },
        // {
        //     "$sort": { [options.sortBy]: options.sortOrder }
        // },
    ];
    if (options.sortBy && options.sortOrder) {
        searchAggregaates.push({
            $sort: { [options.sortBy]: options.sortOrder },
        });
    }
    const pagzingAggregaates = [
        {
            $skip: (options.page - 1) * options.limit,
        },
        {
            $limit: options.limit,
        },
    ];
    // console.log('searchAggregaates,',searchAggregaates)
    const breakdowns = await Breakdown.aggregate([...searchAggregaates, ...pagzingAggregaates]);
    const countAggregaates = [
        {
            $count: 'totalResults',
        },
    ];
    const totalResults = await Breakdown.aggregate([...searchAggregaates, ...countAggregaates]);
    return {
        breakdowns,
        totalResults: totalResults[0],
    };
};
/**
 * Get user by id
 * @param {ObjectId} id
 * @returns {Promise<User>}
 */
const getBreakdownById = async (id) => {
    const breakdown = await Breakdown.findById(id).populate([
        {
            path: 'assetMaintenance',
            populate: [
                {
                    path: 'assetModel',
                    populate: [
                        { path: 'asset' },
                        { path: 'assetTypeCategory' },
                        { path: 'manufacturer' },
                        { path: 'subCategory' },
                        { path: 'supplier' },
                        { path: 'category' },
                        { path: 'subCategory' },
                    ],
                },
                { path: 'customer' },
                { path: 'customer' },
                { path: 'building' },
                { path: 'floor' },
                { path: 'department' },
                { path: 'province' },
                { path: 'commune' },
            ],
        },
        {
            path: 'breakdownDefect',
        },
        {
            path: 'subServiceCategory',
        },
        { path: 'serviceCategory' },
        { path: 'createdBy', select: 'username' },
        { path: 'amc' },
    ]);
    if (!breakdown) {
        throw new ApiError(httpStatus.NOT_FOUND, 'breakdown not found');
    }
    return breakdown;
};
const completedBreakdownSchedulePreventiveTaskItem = async (_schedulePreventiveTaskItem) => {
    const schedulePreventiveTaskItem = await SchedulePreventiveTaskItemModel.findById(_schedulePreventiveTaskItem);
    if (!schedulePreventiveTaskItem) {
        throw new ApiError(httpStatus.NOT_FOUND, 'schedulePreventiveTaskItem not found');
    }
    const breakdownBySchedulePreventiveTaskItems = await Breakdown.find({
        schedulePreventiveTask: schedulePreventiveTaskItem.schedulePreventiveTask,
    });
    const allCompleted = breakdownBySchedulePreventiveTaskItems.every(
        (item) => item.ticketStatus === ticketBreakdownStatus.cloesed
    );
    if (allCompleted) {
        const schedulePreventiveTask = await SchedulePreventiveTaskModel.findById(
            schedulePreventiveTaskItem.schedulePreventiveTask
        );
        if (schedulePreventiveTask) {
            const schedulePreventiveTaskAssignUser = await SchedulePreventiveTaskAssignUserModel.findOneAndUpdate(
                {
                    schedulePreventiveTask: schedulePreventiveTask._id,
                    status: schedulePreventiveTaskAssignUserStatus.partiallyCompleted,
                    isCancel: false,
                },
                { status: schedulePreventiveTaskAssignUserStatus.completed }
            );
            // tạo thông báo - không cần thiết
            await schedulePreventiveService.switchToWaitingForAdminApproval(schedulePreventiveTask.schedulePreventive);
        }
    }
    return allCompleted;
};
const cancelBreakdown = async (id, reasonCancel, req) => {
    const breakdown = await getBreakdownById(id);
    if (!breakdown) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Breakdown not found');
    }
    await checkAssetMaintenanceIsNotActiveHistoryCloseWithBreakdown(breakdown._id, breakdown.assetMaintenance);
    // cập nhật lại calibration
    if (breakdown.calibrationWorkAssignUser) {
        const calibrationWorkAssignUser = await CalibrationWorkAssignUserModel.findById(breakdown.calibrationWorkAssignUser);
        const _calibrationWork = await CalibrationWorkModel.findById(calibrationWorkAssignUser?.calibrationWork);
        if (
            calibrationWorkAssignUser &&
            calibrationWorkAssignUser?.calibrationWork &&
            calibrationWorkAssignUser?.user &&
            (calibrationWorkAssignUser.status === calibrationWorkAssignUserStatus.inProgress ||
                calibrationWorkAssignUser.status === calibrationWorkAssignUserStatus.partiallyCompleted)
        ) {
            calibrationWorkAssignUser.status = calibrationWorkAssignUserStatus.completeRecalibrationIssue;
            await calibrationWorkAssignUser.save();
            // thông báo về sự cố đã hủy
            const payloadNoti = {
                notificationTypeCode: notificationTypeCode.complete_the_issue_during_calibration,
                text: `Sự cố ${breakdown?.code} của hiệu chuẩn ${_calibrationWork.code} hoàn thành. Vui lòng truy cập vào công việc hiệu chuẩn để thực hiện tiếp công việc`,
                subUrl: `my-calibration-work/detail/${calibrationWorkAssignUser._id}`,
                webSubUrl: `calibration/calibration-work/view/${calibrationWorkAssignUser.calibrationWork}`,
                notificationName: 'Hoàn thành vấn đề sự cố khi hiệu chuẩn',
                user: calibrationWorkAssignUser?.user,
            };
            await notificationService.pushNotificationWithUser(payloadNoti);
            const calibrationWorkService = require('../calibration/calibrationWork.service');
            const history = await calibrationWorkService.getCalibrationWorkTimelineByRes({
                calibrationWork: calibrationWorkAssignUser?.calibrationWork,
            });
            const payloadTimeline = {
                calibrationWork: calibrationWorkAssignUser?.calibrationWork,
                oldStatus: history ? history.status : 'null',
                status: progressStatus.completeRecalibrationIssue,
                workedBy: req.user.id,
                workedDate: Date.now(),
            };
            await calibrationWorkService.createCalibrationWorkTimeline(payloadTimeline);
        }
    }
    if (breakdown.propertyInspection) {
        const propertyInspection = await PropertyInspectionModel.findById(breakdown.propertyInspection);
        if (propertyInspection.status === propertyInspectionStatus.partiallyCompleted) {
            propertyInspection.status = propertyInspectionStatus.waitingForAdminApproval;
            await propertyInspection.save();
            if (propertyInspection.assetMaintenance) {
                const assetMaintenance = await AssetMaintenance.findById(propertyInspection.assetMaintenance).populate({
                    path: 'asset',
                });
                const assetMaintenanceUsers = await AssetMaintenanceUserModel.find({
                    assetMaintenance: propertyInspection.assetMaintenance,
                });
                if (assetMaintenanceUsers && assetMaintenanceUsers.length > 0) {
                    const users = assetMaintenanceUsers.map((item) => item.user);
                    const payloadNoti = {
                        notificationTypeCode: notificationTypeCode.property_inspection,
                        text: `Kiểm tra tài sản ${assetMaintenance?.asset?.assetName}, vấn đề sự cố đã được giải quyết. Vui lòng truy cập để theo dõi hoàn thành tiếp công việc kiểm tra`,
                        subUrl: `maintenance/property-inspection/view/${propertyInspection._id}`,
                        webSubUrl: `maintenance/property-inspection/view/${propertyInspection._id}`,
                        notificationName: 'Kiểm tra tài sản',
                        users: users,
                    };
                    await notificationService.pushNotificationWithUsers(payloadNoti);
                }
            }
        }
    }
    Object.assign(breakdown, {
        status: breakdownAssignUserStatus.cancelled,
        reasonCancel,
        ticketStatus: ticketBreakdownStatus.cloesed,
    });
    // cập nhật assignuer về hủy
    await BreakdownAssignUserModel.updateMany(
        { breakdown: id },
        {
            status: breakdownAssignUserStatus.cancelled,
        }
    );
    await breakdown.save();
    if (breakdown.schedulePreventiveTaskItem) {
        await completedBreakdownSchedulePreventiveTaskItem(breakdown.schedulePreventiveTaskItem);
    }
    return breakdown;
};
const updateBreakdownById = async (id, updateBody) => {
    const breakdown = await Breakdown.findById(id);
    if (!breakdown) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Breakdown not found');
    }
    Object.assign(breakdown, updateBody);
    await breakdown.save();
    return breakdown;
};
const updateStatus = async (id, updateBody) => {
    const breakdown = await Breakdown.findById(id);
    if (!breakdown) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Breakdown not found');
    }
    Object.assign(breakdown, updateBody);
    await breakdown.save();
    return breakdown;
};
const checkAssetMaintenanceIsNotActiveHistoryCloseWithBreakdown = async (breakdownId, assetMaintenance) => {
    const assetMaintenanceService = require('./assetMaintenance.service');
    const totalTask = await assetMaintenanceService.getConutTaskAssetMaintenance(assetMaintenance);
    // console.log('totalTask', totalTask);
    if (totalTask <= 1) {
        const condition = {
            assetMaintenance: assetMaintenance,
            endDate: null,
        };
        // check có record do chính breakdown này tạo không
        const existed = await AssetMaintenanceIsNotActiveHistoryModel.exists({
            ...condition,
            origin: breakdownId,
        });
        if (existed) {
            // xóa luôn (không cần find trước)
            await AssetMaintenanceIsNotActiveHistoryModel.deleteMany({
                ...condition,
                origin: breakdownId,
            });
        } else {
            // đóng record hiện tại
            await AssetMaintenanceIsNotActiveHistoryModel.updateOne(condition, { $set: { endDate: new Date() } });
        }
    }
};
const deleteBreakdownById = async (id) => {
    const breakdown = await getBreakdownById(id);
    if (!breakdown) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Breakdown not found');
    }
    // tạm thời đóng
    if (breakdown.ticketStatus !== 'new') {
        throw new ApiError(httpStatus.NOT_FOUND, 'Sự cố đang được thực hiện');
    }
    await checkAssetMaintenanceIsNotActiveHistoryCloseWithBreakdown(breakdown._id, breakdown.assetMaintenance);
    await BreakdownAssignUserModel.deleteMany({ breakdown: id });
    await BreakdownCommentModel.deleteMany({ breakdown: id });
    await breakdown.remove();
    return breakdown;
};

const getAllBreakdown = async (filter = {}) => {
    const breakdowns = await Breakdown.find(filter);
    return breakdowns;
};

const getAllBreakdownDefect = async () => {
    const breakdownDefects = await BreakdownDefect.find();
    return breakdownDefects;
};
const getBreakdownComments = async (filter, options) => {
    const breakdownFilter = { ...filter };
    // Đổi breakdownId thành breakdown nếu schema là breakdown
    if (filter.breakdown && mongoose.Types.ObjectId.isValid(filter.breakdown)) {
        breakdownFilter.breakdown = new mongoose.Types.ObjectId(filter.breakdown);
    }
    const breakdowns = await BreakdownCommentModel.paginate(breakdownFilter, {
        ...options,
        populate: [
            {
                path: 'createdBy',
                select: 'username',
            },
        ],
    });
    return breakdowns;
};
const createBreakdownComment = async (data) => {
    await BreakdownCommentModel.create(data);
};

const createBreakdownAttachment = async (data) => {
    await BreakdownAttachmentModel.create(data);
};
const getBreakdownAttachmentByBreakdownId = async (breakdownId) => {
    return BreakdownAttachmentModel.find({ breakdown: breakdownId }).populate({ path: 'resource' });
};
const deleteBreakdownAttachmentByIdBreakdown = async (breakdownId) => {
    const breakdownAttachment = await BreakdownAttachmentModel.findById(breakdownId);
    if (!breakdownAttachment) {
        throw new ApiError(httpStatus.NOT_FOUND, 'BreakdownAttachment not found');
    }
    await BreakdownAttachmentModel.deleteOne({ breakdown: breakdownId });
    return breakdownAttachment;
};
const getAllBreakdownAttachment = async (filter) => {
    const breakdownAttachments = await BreakdownAttachmentModel.find(filter).populate({
        path: 'resource',
        populate: {
            path: 'createdBy',
            select: 'fullName',
        },
    });

    return breakdownAttachments;
};
const getAllAttachmentByBreackdown = async (breakdown) => {
    const breakdownAssignUserIds = await BreakdownAssignUserModel.find(breakdown).distinct('_id');

    const breakdownAssignUserRepairIds = await BreakdownAssignUserRepairModel.find({
        breakdownAssignUser: { $in: breakdownAssignUserIds },
    }).distinct('_id');

    const breakdownAssignUserRepairAttachment = await BreakdownAssignUserAttachmentModel.find({
        breakdownAssignUserRepair: { $in: breakdownAssignUserRepairIds },
    }).populate({
        path: 'resource',
        populate: {
            path: 'createdBy',
            select: 'fullName',
        },
    });

    return breakdownAssignUserRepairAttachment;
};
const createinsertManyBreakdownAttachmentClose = async (data) => {
    return BreakdownAttachmentCloseModel.insertMany(data);
};
const getBreakdownAttachmentCloseModelByBreakdown = async (breakdown) => {
    const breakdownAttachmentCloseModel = BreakdownAttachmentCloseModel.find(breakdown).populate({
        path: 'resource',
        populate: {
            path: 'createdBy',
            select: 'fullName',
        },
    });

    return breakdownAttachmentCloseModel;
};
const createBreakdownHistory = async (data) => {
    return BreakdownHistoryModel.create(data);
};

const getBreakdownHistoryByRes = async (data) => {
    return BreakdownHistoryModel.findOne(data).sort({ createdAt: -1 });
};
const updateBreakdownHistory = async (res, data) => {
    const breakdownHistory = await getBreakdownHistoryByRes(res);
    if (!breakdownHistory) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Breakdown not found');
    }
    Object.assign(breakdownHistory, data);
    await breakdownHistory.save();
    return breakdownHistory;
};
const getAllBreakdownHistory = async (data) => {
    return BreakdownHistoryModel.find(data)
        .sort({ createdAt: -1 })
        .populate([
            {
                path: 'indicaltedUserBy',
                select: 'fullName',
            },
            {
                path: 'cancelledUserBy',
                select: 'fullName',
            },
            {
                path: 'designatedUser',
                select: 'fullName',
            },
            {
                path: 'openUser',
                select: 'fullName',
            },
            {
                path: 'approvedBy',
                select: 'fullName',
            },
            {
                path: 'closeBy',
                select: 'fullName',
            },
            {
                path: 'reopenBy',
                select: 'fullName',
            },
            {
                path: 'experimentalFixBy',
                select: 'fullName',
            },
            {
                path: 'workedBy',
                select: 'fullName',
            },
            {
                path: 'replacementBy',
                select: 'fullName',
            },
            {
                path: 'fixedOnTrialBy',
                select: 'fullName',
            },
            {
                path: 'replacementUser',
                select: 'fullName',
            },
        ]);
};

const getAllSearchMyBreakdown = async (filter, options) => {
    const breakdownFilter = filter;
    if (filter.user) {
        // Lấy tất cả breakdownId mà user này được assign
        const assignUsers = await BreakdownAssignUserModel.find({ user: filter.user }).select('breakdown');
        const breakdownIds = assignUsers.map((a) => a.breakdown).filter((id) => id && mongoose.Types.ObjectId.isValid(id));
        // Lọc breakdown theo các breakdownId này
        breakdownFilter._id = { $in: breakdownIds };
        // eslint-disable-next-line no-param-reassign
        delete filter.user;
    }
    if (filter.code) {
        breakdownFilter.code = { $regex: filter.code, $options: 'i' };
    }
    const breakdowns = await Breakdown.paginate(breakdownFilter, {
        ...options,
        populate: [
            {
                path: 'assetMaintenance',
                populate: [
                    {
                        path: 'assetModel',
                        populate: [
                            { path: 'asset' },
                            { path: 'manufacturer' },
                            { path: 'supplier' },
                            { path: 'category' },
                            { path: 'subCategory' },
                            { path: 'assetTypeCategory' },
                        ],
                    },
                    { path: 'customer' },
                    { path: 'building' },
                    { path: 'floor' },
                    { path: 'department' },
                    { path: 'commune' },
                    { path: 'province' },
                ],
            },
            { path: 'breakdownDefect', select: 'name' },
            { path: 'createdBy', select: 'username' },
            { path: 'amc' },
        ],
    });
    return breakdowns;
};

const getTotalBreakdwonStatus = async (filter, req) => {
    const filterMatch = {};
    // kiểm tra xem có được xem tất cả tài sản không
    let allowViewAll = true;
    if (req.companySetting.filterByAccount) {
        const dep = await Department.findById(req.user.department).select('allowViewAll');
        allowViewAll = dep?.allowViewAll;
    }
    const amQuery = {};
    if (filter.branchs && Array.isArray(filter.branchs) && filter.branchs.length > 0) {
        amQuery.branch = { $in: filter.branchs.map((id) => mongoose.Types.ObjectId(id)) };
    }
    if (!allowViewAll) {
        amQuery.department = mongoose.Types.ObjectId(req?.user?.department);
    }

    if (Object.keys(amQuery).length > 0) {
        const validAssetMaintenances = await AssetMaintenance.find(amQuery).select('_id');
        const amIds = validAssetMaintenances.map((asset) => asset._id);
        filterMatch.assetMaintenance = { $in: amIds };
    }
    const totalBreakdownTicketStatusNews = await Breakdown.countDocuments({
        ticketStatus: ticketBreakdownStatus.new,
        ...filterMatch,
    });
    const totalBreakdownTicketStatusInProgress = await Breakdown.countDocuments({
        ticketStatus: ticketBreakdownStatus.inProgress,
        ...filterMatch,
    });
    const totalBreakdownTicketStatusCompleteds = await Breakdown.countDocuments({
        ticketStatus: ticketBreakdownStatus.completed,
        ...filterMatch,
    });

    const OVERDUE_STATUS = [
        'assigned',
        'rejected',
        'accepted',
        'reopen',
        'inProgress',
        'requestForSupport',
        'WCA',
        'reassignment',
        'experimentalFix',
        'pending_approval',
        'approved',
        'submitted',
    ];
    const totalBreakdownStatusOverdues = await Breakdown.countDocuments({
        incidentDeadline: { $lt: new Date() },
        status: { $in: OVERDUE_STATUS },
        ...filterMatch,
    });
    return {
        totalBreakdownTicketStatusNews,
        totalBreakdownTicketStatusInProgress,
        totalBreakdownTicketStatusCompleteds,
        totalBreakdownStatusOverdues,
    };
};

const stopAllPropertyIncidents = async (assetMaintenanceId, user) => {
    // hủy toàn bộ sự cố đang lm việc của tài snar
    const breakdowns = await Breakdown.find({
        assetMaintenance: assetMaintenanceId,
        status: {
            $nin: [breakdownStatus.cancelled, breakdownStatus.cloesed],
        },
    }).select('_id');
    if (!breakdowns.length) return;
    const breakdownIds = breakdowns.map((b) => b._id);
    await Breakdown.updateMany(
        { _id: { $in: breakdownIds } },
        {
            status: breakdownStatus.cancelled,
            reasonCancel: 'Tài sản đã đưa về chờ thanh lý',
            cancelDate: new Date(),
            ticketStatus: ticketBreakdownStatus.cloesed,
        }
    );
    await BreakdownAssignUserModel.updateMany(
        { breakdown: { $in: breakdownIds } },
        {
            cancelled: true,
            reasonCancel: 'Tài sản đã đưa về chờ thanh lý',
            cancellationTime: new Date(),
            status: breakdownAssignUserStatus.cancelled,
        }
    );
    const breakdownAssignUsers = await BreakdownAssignUserModel.find({ breakdown: { $in: breakdownIds } }).select('_id');
    const breakdownAssignUserIds = breakdownAssignUsers.map((b) => b._id);
    await BreakdownAssignUserCheckinCheckOutModel.updateMany(
        { breakdownAssignUser: { $in: breakdownAssignUserIds }, logOutAt: null },
        { logOutAt: new Date(), checkOutComments: 'Tài sản đã đưa về chờ thanh lý' }
    );
    for (const breakdownId of breakdownIds) {
        await createBreakdownHistoryByStatus(
            breakdownId,
            breakdownAssignUserStatus.cancelled,
            user,
            'Tài sản đã đưa về chờ thanh lý'
        );
    }
};

// const workingTimeBreakdown = async (breakdownId) => {
//     const breakdown = await Breakdown.findById(breakdownId);
//     if (!breakdown) {
//         throw new ApiError(httpStatus.NOT_FOUND, 'breakdown not found');
//     }
//     let workingTime = null;
//     let startDate = null;
//     let endDate = null;

//     if (!breakdown.assetMaintenance) {
//         return {
//             time: 0, endDate, startDate
//         };
//     }
//     const assetMaintenance = await AssetMaintenance.findById(breakdown.assetMaintenance);
//     if (!assetMaintenance.customer) {
//         return {
//             time: 0, endDate, startDate
//         };
//     }
//     if (breakdown.status === progressStatus.cancelled) {
//         return {
//             time: 0, endDate, startDate
//         };
//     }
//     if (breakdown.assetMaintenanceStatus && (breakdown.assetMaintenanceStatus === assetMaintenanceStatus.isActive)) {
//         startDate = breakdown.createdAt;
//         endDate = breakdown.closingDate ? breakdown.closingDate : new Date();
//         workingTime = breakdown.downTimeMilis;
//     } else {
//         const _breakdownAssignUsers = await BreakdownAssignUserModel.find({ breakdown: breakdown._id });
//         startDate = (assetMaintenance.installationDate && assetMaintenance.installationDate > breakdown.createdAt) ? assetMaintenance.installationDate : breakdown.createdAt;
//         if ((breakdown.ticketStatus === ticketBreakdownStatus.cloesed && breakdown.status === progressStatus.cloesed)
//             || (breakdown.ticketStatus === ticketBreakdownStatus.completed)) {
//             const closedUsers = _breakdownAssignUsers.filter(
//                 (data) => data.completedTime
//             );
//             if (closedUsers.length > 0) {
//                 const latestCompletedUser = closedUsers.reduce((latest, current) =>
//                     current.completedTime > latest.completedTime ? current : latest
//                 );
//                 endDate = latestCompletedUser.completedTime;
//             }
//         } else {
//             // tất cả đều hoàn thành
//             endDate = new Date()
//         }
//         if (endDate < startDate) return {
//             time: 0, endDate, startDate
//         };
//         workingTime = new Date(endDate) - new Date(startDate);
//     }
//     return {
//         time: workingTime, endDate, startDate
//     };
// }
const workingTimeBreakdown = async (breakdownId) => {
    const breakdown = await Breakdown.findById(breakdownId).lean();
    if (!breakdown) throw new ApiError(httpStatus.NOT_FOUND, 'breakdown not found');
    if (breakdown.status === progressStatus.cancelled) {
        return { time: 0, startDate: null, endDate: null };
    }
    const assetMaintenanceIsNotActiveHistory = await AssetMaintenanceIsNotActiveHistoryModel.findOne({
        origin: breakdownId,
    });
    if (!assetMaintenanceIsNotActiveHistory) {
        return { time: 0, startDate: null, endDate: null };
    }
    return {
        time: assetMaintenanceIsNotActiveHistory.endDate
            ? assetMaintenanceIsNotActiveHistory.time
            : new Date() - new Date(assetMaintenanceIsNotActiveHistory.startDate),
        startDate: new Date(assetMaintenanceIsNotActiveHistory.startDate),
        endDate: assetMaintenanceIsNotActiveHistory.endDate ? assetMaintenanceIsNotActiveHistory.endDate : new Date(),
    };
};

const workingTimeBreakdowns = async (breakdownIds) => {
    const assetMaintenanceNotActives = await AssetMaintenanceIsNotActiveHistoryModel.find({
        origin: { $in: breakdownIds },
    });
    const totalDowntime = assetMaintenanceNotActives.reduce(
        (sum, r) => sum + (r.endDate ? r.time : new Date() - r.startDate),
        0
    );
    return totalDowntime;
};
const getBreakdownsByStatus = async (filter, options) => {
    const breakdownFilter = {};

    if (filter.ticketStatuses && Array.isArray(filter.ticketStatuses) && filter.ticketStatuses.length > 0) {
        breakdownFilter.ticketStatus = { $in: filter.ticketStatuses };
    }

    // Truy vấn dữ liệu breakdowns
    const breakdowns = await Breakdown.find(breakdownFilter)
        .paginate()
        .sort(options.sortBy)
        .skip((options.page - 1) * options.limit)
        .limit(options.limit);

    return breakdowns;
};
const getBreakdownAssignUserFirt = async (breakdownId) => {
    const breakdownAssignUser = await BreakdownAssignUserModel.findOne({ breakdown: breakdownId }).sort({ createdAt: 1 }); // 1 = ASC, lấy bản ghi sớm nhất
    return breakdownAssignUser;
};
const totalTimeCosumed = async (breakdownAssignUserId) => {
    const breakdownAssignUser = await BreakdownAssignUserModel.findById(breakdownAssignUserId);
    if (!breakdownAssignUser) {
        throw new ApiError(httpStatus.NOT_FOUND, 'breakdownAssignUser not found');
    }
    const breakdownAssignUsers = await BreakdownAssignUserCheckinCheckOutModel.aggregate([
        {
            $match: { breakdownAssignUser: breakdownAssignUser._id },
        },
        {
            $group: {
                _id: null,
                totalConsumed: {
                    $sum: {
                        $subtract: [
                            { $ifNull: ['$logOutAt', new Date()] }, // nếu không có logOutAt thì lấy giờ hiện tại
                            '$logInAt',
                        ],
                    },
                },
            },
        },
    ]);
    const totalConsumedMs = breakdownAssignUsers.length > 0 ? breakdownAssignUsers[0].totalConsumed : 0;
    return totalConsumedMs;
};
const getBreakdownByIdNoPopulate = async (id) => {
    const breakdown = await Breakdown.findById(id);
    if (!breakdown) {
        throw new ApiError(httpStatus.NOT_FOUND, 'breakdown not found');
    }
    return breakdown;
};
const getGroupBreakdownByUsers = async (filter, options, _assetMaintenanceFilter) => {
    const breakdownFilter = filter;
    const userIds = await SchegetUserIdsByDepartment(user);
    if (filter.code) {
        breakdownFilter.code = { $regex: filter.code, $options: 'i' };
    }
    if (filter.breakdownIds) {
        breakdownFilter._id = {
            $in: filter.breakdownIds,
        };
    }
    if (filter.breakdownStatus) {
        breakdownFilter.status = filter.breakdownStatus;
        delete filter.breakdownStatus;
    }
    if (filter.ticketStatuses) {
        breakdownFilter.ticketStatus = {
            $in: filter.ticketStatuses,
        };
    }
    // check cho phần quá hạn
    if (filter.isOverdue) {
        breakdownFilter.incidentDeadline = { $lt: new Date() };
    }

    delete breakdownFilter.breakdownIds;
    delete breakdownFilter.isOverdue;
    delete breakdownFilter.ticketStatuses;
    const moreFilter = {};
    if (_assetMaintenanceFilter.assetStyles && _assetMaintenanceFilter.assetStyles.length > 0) {
        moreFilter['assetMaintenances.assetStyle'] = {
            $in: _assetMaintenanceFilter.assetStyles,
        };
    }
    if (filter.assetName) {
        moreFilter['asset.assetName'] = {
            $regex: filter.assetName,
            $options: 'i',
        };
        delete filter.assetName;
    }
    if (filter.assetModelName) {
        moreFilter['assetMaintenance.assetModel.assetModelName'] = {
            $regex: filter.assetModelName,
            $options: 'i',
        };
        delete filter.assetModelName;
    }

    if (filter.serial) {
        moreFilter['assetMaintenance.serial'] = {
            $regex: filter.serial,
            $options: 'i',
        };
        delete filter.serial;
    }
    if (filter.assetStyle) {
        moreFilter['assetMaintenance.assetStyle'] = filter.assetStyle;
        delete filter.assetStyle;
    }
    if (_assetMaintenanceFilter.priorityLevels && _assetMaintenanceFilter.priorityLevels.length > 0) {
        moreFilter.priorityLevel = { $in: _assetMaintenanceFilter.priorityLevels };
    }
    if (_assetMaintenanceFilter.startDate && _assetMaintenanceFilter.endDate) {
        moreFilter.incidentDeadline = {
            $gte: new Date(_assetMaintenanceFilter.startDate),
            $lte: new Date(_assetMaintenanceFilter.endDate),
        };
    }
    if (_assetMaintenanceFilter.branchs && _assetMaintenanceFilter.branchs.length > -1) {
        const _branchs = _assetMaintenanceFilter.branchs.map((_b) => mongoose.Types.ObjectId(_b));
        moreFilter['assetMaintenances.branch'] = {
            $in: _branchs,
        };
    }
    if (_assetMaintenanceFilter.customers && _assetMaintenanceFilter.customers.length > 0) {
        moreFilter['assetMaintenances.customer'] = {
            $in: _assetMaintenanceFilter.customers.map((_) => {
                return mongoose.Types.ObjectId(_);
            }),
        };
    }
    if (_assetMaintenanceFilter.assetModels && _assetMaintenanceFilter.assetModels.length > 0) {
        moreFilter['assetmodels._id'] = {
            $in: _assetMaintenanceFilter.assetModels.map((_) => {
                return mongoose.Types.ObjectId(_);
            }),
        };
    }
    if (_assetMaintenanceFilter.assetMaintenances && _assetMaintenanceFilter.assetMaintenances.length > 0) {
        moreFilter['assetMaintenances._id'] = {
            $in: _assetMaintenanceFilter.assetMaintenances.map((_) => {
                return mongoose.Types.ObjectId(_);
            }),
        };
    }
    if (_assetMaintenanceFilter.serviceCategorys && _assetMaintenanceFilter.serviceCategorys.length > 0) {
        moreFilter['servicecategories._id'] = {
            $in: _assetMaintenanceFilter.serviceCategorys.map((_) => {
                return mongoose.Types.ObjectId(_);
            }),
        };
    }
    if (_assetMaintenanceFilter.subServiceCategorys && _assetMaintenanceFilter.subServiceCategorys.length > 0) {
        moreFilter['servicesubcategories._id'] = {
            $in: _assetMaintenanceFilter.subServiceCategorys.map((_) => {
                return mongoose.Types.ObjectId(_);
            }),
        };
    }
    if (_assetMaintenanceFilter.categorys && _assetMaintenanceFilter.categorys.length > 0) {
        moreFilter['categories._id'] = {
            $in: _assetMaintenanceFilter.categorys.map((_) => {
                return mongoose.Types.ObjectId(_);
            }),
        };
    }
    if (_assetMaintenanceFilter.assets && _assetMaintenanceFilter.assets.length > 0) {
        moreFilter['assets._id'] = {
            $in: _assetMaintenanceFilter.assets.map((_) => {
                return mongoose.Types.ObjectId(_);
            }),
        };
    }
    if (_assetMaintenanceFilter.manufacturers && _assetMaintenanceFilter.manufacturers.length > 0) {
        moreFilter['manufacturers._id'] = {
            $in: _assetMaintenanceFilter.manufacturers.map((_) => {
                return mongoose.Types.ObjectId(_);
            }),
        };
    }
    const searchAggregaates = [
        {
            $match: breakdownFilter,
        },
        {
            $lookup: {
                from: 'servicecategories',
                localField: 'serviceCategory',
                foreignField: '_id',
                as: 'servicecategories',
            },
        },
        {
            $lookup: {
                from: 'servicesubcategories',
                localField: 'subServiceCategory',
                foreignField: '_id',
                as: 'servicesubcategories',
            },
        },
        {
            $lookup: {
                from: 'assetmaintenances',
                localField: 'assetMaintenance',
                foreignField: '_id',
                as: 'assetMaintenances',
            },
        },
        {
            $lookup: {
                from: 'assets',
                localField: 'assetMaintenances.asset',
                foreignField: '_id',
                as: 'assets',
            },
        },
        {
            $lookup: {
                from: 'assets',
                localField: 'assetMaintenances.asset',
                foreignField: '_id',
                as: 'asset',
            },
        },
        {
            $lookup: {
                from: 'assetmaintenances',
                localField: 'assetMaintenance',
                foreignField: '_id',
                as: 'assetMaintenance',
            },
        },

        { $unwind: { path: '$assetMaintenance', preserveNullAndEmptyArrays: true } },
        { $unwind: { path: '$asset', preserveNullAndEmptyArrays: true } },
        // { $match: moreFilter },
        {
            $lookup: {
                from: 'categories',
                localField: 'assetmodels.category',
                foreignField: '_id',
                as: 'categories',
            },
        },
        {
            $lookup: {
                from: 'manufacturers',
                localField: 'assetmodels.manufacturer',
                foreignField: '_id',
                as: 'manufacturers',
            },
        },
        {
            $lookup: {
                from: 'customers',
                localField: 'assetMaintenances.customer',
                foreignField: '_id',
                as: 'customers',
            },
        },
        { $match: moreFilter },
    ];
    if (options.sortBy && options.sortOrder) {
        searchAggregaates.push({
            $sort: { [options.sortBy]: options.sortOrder },
        });
    }
    const pagzingAggregaates = [
        {
            $skip: (options.page - 1) * options.limit,
        },
        {
            $limit: options.limit,
        },
    ];
    const breakdowns = await Breakdown.aggregate([...searchAggregaates, ...pagzingAggregaates]);
    const countAggregaates = [
        {
            $count: 'totalResults',
        },
    ];
    const totalResults = await Breakdown.aggregate([...searchAggregaates, ...countAggregaates]);
    return {
        breakdowns,
        totalResults: totalResults[0],
    };
};
const getBreakdownByRes = async (data) => {
    const breakdowns = await Breakdown.find(data).sort({ createdAt: -1 });
    return breakdowns;
};
const getBreakdownByResFindOne = async (data) => {
    const breakdown = await Breakdown.findOne(data).sort({ createdAt: -1 });
    return breakdown;
};
const getAssetIncidentHistorys = async (filter, options) => {
    const payloadFilter = {};
    if (filter.assetMaintenance) {
        payloadFilter.assetMaintenance = mongoose.Types.ObjectId(filter.assetMaintenance);
    }
    if (filter.code) {
        payloadFilter.code = filter.code;
    }
    if (filter.priorityLevel) {
        payloadFilter.priorityLevel = filter.priorityLevel;
    }
    if (filter.assetStyle) {
        payloadFilter.assetStyle = filter.assetStyle;
    }
    if (filter.statuses) {
        payloadFilter.status = { $in: filter.statuses };
    }
    const dateFilter = {};
    if (filter.startDate) {
        dateFilter.$gte = new Date(filter.startDate);
    }
    if (filter.endDate) {
        const end = new Date(filter.endDate);
        end.setHours(23, 59, 59, 999); // tính tới cuối ngày
        dateFilter.$lte = end;
    }
    if (Object.keys(dateFilter).length) {
        payloadFilter.createdAt = { ...dateFilter };
    }
    const breakdowns = await Breakdown.paginate(payloadFilter, {
        ...options,
        populate: [
            {
                path: 'assetMaintenance',
                populate: [
                    {
                        path: 'customer',
                    },
                ],
            },
        ],
    });
    return breakdowns;
};
module.exports = {
    queryBreakdowns,
    getBreakdownById,
    updateBreakdownById,
    deleteBreakdownById,
    createBreakdown,
    updateStatus,
    getAllBreakdown,
    getAllBreakdownDefect,
    getBreakdownComments,
    createBreakdownComment,
    createBreakdownAttachment,
    getBreakdownAttachmentByBreakdownId,
    deleteBreakdownAttachmentByIdBreakdown,
    getAllBreakdownAttachment,
    createinsertManyBreakdownAttachmentClose,
    createBreakdownHistory,
    getBreakdownHistoryByRes,
    updateBreakdownHistory,
    getAllBreakdownHistory,
    getAllSearchMyBreakdown,
    getTotalBreakdwonStatus,
    cancelBreakdown,
    getBreakdownsByStatus,
    workingTimeBreakdown,
    completedBreakdownSchedulePreventiveTaskItem,
    getBreakdownAssignUserFirt,
    totalTimeCosumed,
    getBreakdownByIdNoPopulate,
    workingTimeBreakdowns,
    getGroupBreakdownByUsers,
    getBreakdownByRes,
    getBreakdownByResFindOne,
    getAssetIncidentHistorys,
    getAllAttachmentByBreackdown,
    getBreakdownAttachmentCloseModelByBreakdown,
    stopAllPropertyIncidents
};
