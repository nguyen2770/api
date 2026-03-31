const httpStatus = require('http-status');
const mongoose = require('mongoose');
const { Types } = require('mongoose');
const {
    SchedulePreventiveModel,
    SchedulePreventiveTaskAssignUserModel,
    SchedulePreventiveTaskModel,
    SchedulePreventiveTaskItemModel,
    SchedulePreventiveCommentModel,
    SchedulePreventiveSparePartModel,
    PreventiveTaskAssignUserModel,
    PreventiveTaskModel,
    PreventiveTaskItemModel,
    PreventiveCommentModel,
    PreventiveSparePartModel,
    SchedulePreventiveCheckinCheckOutModel,
    PreventiveModel,
    AssetMaintenance,
    SchedulePreventiveHistoryModel,
    Breakdown,
    AssetMaintenanceIsNotActiveHistoryModel,
    User,
    SchedulePrevetiveTaskSparePartRequestModel,
    ApprovalTaskModel,
    SchedulePreventiveDocumentsModel,
    Department,
} = require('../../models');
const ApiError = require('../../utils/ApiError');
const notificationService = require('../notification/notification.service');
const assetMaintenanceIsNotActiveHistoryService = require('../common/assetMaintenanceIsNotActiveHistory.service');
const {
    schedulePreventiveStatus,
    schedulePreventiveTaskAssignUserStatus,
    progressStatus,
    ticketSchedulePreventiveStatus,
    historySchedulePreventiveStatus,
    schedulePreventiveWorkingStatus,
    schedulePreventiveTaskRequestSparePartStatus,
    approvedTaskType,
    notificationTypeCode,
} = require('../../utils/constant');
const config = require('../../config/config');
const { forever } = require('request');
const { approvalTaskService } = require('../');
const SchedulePreventive = require('../../models/preventive/schedulePreventive.model');

const getLatestSchedulePreventiveHistory = async () => {
    const latest = await SchedulePreventiveHistoryModel.findOne() // lấy 1 bản ghi
        .sort({ createdAt: -1 }) // sắp xếp giảm dần theo createdDate
        .lean(); // trả về plain object (không phải Mongoose document)
    return latest;
};

const createSchedulePreventiveHistory = async (data) => {
    const create = await SchedulePreventiveHistoryModel.create(data);
    return create;
};
/**
 * Create a user
 * @param {Object} category
 * @returns {Promise<User>}
 */
const confirmSchedulePreventiveUser = async (_schedulePreventiveTask, _user) => {
    const shedulePreventiveTaskAssignUser = await SchedulePreventiveTaskAssignUserModel.findOne({
        schedulePreventiveTask: _schedulePreventiveTask,
        user: _user,
        isCancel: false,
    });
    if (!shedulePreventiveTaskAssignUser) {
        throw new ApiError(httpStatus.NOT_FOUND, 'shedulePreventiveTaskAssignUser not found');
    }
    shedulePreventiveTaskAssignUser.status = schedulePreventiveTaskAssignUserStatus.accepted;
    shedulePreventiveTaskAssignUser.confirmDate = new Date();
    await shedulePreventiveTaskAssignUser.save();
    // lưu lịch sử
    const latestSchedulePreventiveHistory = await getLatestSchedulePreventiveHistory();
    const _payloadHistorySchedulePreventive = {
        schedulePreventive: shedulePreventiveTaskAssignUser.schedulePreventive,
        schedulePreventiveTask: shedulePreventiveTaskAssignUser.schedulePreventiveTask,
        status: historySchedulePreventiveStatus.accepted,
        createdBy: _user,
        oldStatus: latestSchedulePreventiveHistory.status,
    };
    await createSchedulePreventiveHistory(_payloadHistorySchedulePreventive);
    return shedulePreventiveTaskAssignUser;
};
const cancelConfirmSchedulePreventiveUser = async (_schedulePreventiveTask, _user, _reasonCancelConfirm) => {
    const shedulePreventiveTaskAssignUser = await SchedulePreventiveTaskAssignUserModel.findOne({
        schedulePreventiveTask: _schedulePreventiveTask,
        user: _user,
        isCancel: false,
    });
    if (!shedulePreventiveTaskAssignUser) {
        throw new ApiError(httpStatus.NOT_FOUND, 'shedulePreventiveTaskAssignUser not found');
    }
    Object.assign(shedulePreventiveTaskAssignUser, {
        status: schedulePreventiveTaskAssignUserStatus.reassignment,
        reasonCancelConfirm: _reasonCancelConfirm,
        cancelConfirmDate: new Date(),
    });

    await shedulePreventiveTaskAssignUser.save();
    // lưu lịch sử
    const latestSchedulePreventiveHistory = await getLatestSchedulePreventiveHistory();
    const _payloadHistorySchedulePreventive = {
        schedulePreventive: shedulePreventiveTaskAssignUser.schedulePreventive,
        schedulePreventiveTask: shedulePreventiveTaskAssignUser.schedulePreventiveTask,
        status: historySchedulePreventiveStatus.accepted,
        createdBy: _user,
        oldStatus: latestSchedulePreventiveHistory.status,
    };
    await createSchedulePreventiveHistory(_payloadHistorySchedulePreventive);
    return shedulePreventiveTaskAssignUser;
};
const getCountSchedulePrevetiveTaskAssignUserByTask = async (_schedulePreventiveTask) => {
    const count = await SchedulePreventiveTaskAssignUserModel.countDocuments({
        schedulePreventiveTask: _schedulePreventiveTask,
        status: { $ne: schedulePreventiveTaskAssignUserStatus.replacement },
        isCancel: false,
    });
    return count;
};
const createSchedulePreventive = async (data) => {
    // check những tài sản thuộc trạng thái chờ thanh lý không thể tiếp tục công việc
    const assetMaintenanceService = require('../common/assetMaintenance.service');
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
    const schedulePreventive = await SchedulePreventiveModel.create(newData);
    if (data.preventive) {
        // Lấy dữ liệu liên quan từ Preventive
        const assignUsers = await PreventiveTaskAssignUserModel.find({ preventive: data.preventive }).lean();
        const tasks = await PreventiveTaskModel.find({ preventive: data.preventive }).lean();
        const taskIds = tasks.map((t) => t._id);
        const taskItems = await PreventiveTaskItemModel.find({ preventiveTask: { $in: taskIds } }).lean();
        const comments = await PreventiveCommentModel.find({ preventive: data.preventive }).lean();
        const spareParts = await PreventiveSparePartModel.find({ preventive: data.preventive }).lean();

        // Copy Tasks
        const taskIdMap = {};
        // eslint-disable-next-line no-restricted-syntax
        for (const task of tasks) {
            // eslint-disable-next-line no-await-in-loop
            const newTask = await SchedulePreventiveTaskModel.create({
                ...task,
                schedulePreventive: schedulePreventive.id,
                _id: undefined,
                preventive: data.preventive,
                preventiveTask: task._id,
            });
            taskIdMap[task._id] = newTask._id;
        }
        // Copy Task Items
        // eslint-disable-next-line no-restricted-syntax
        for (const item of taskItems) {
            // eslint-disable-next-line no-await-in-loop
            await SchedulePreventiveTaskItemModel.create({
                ...item,
                schedulePreventiveTask: taskIdMap[item.preventiveTask],
                _id: undefined,
                preventiveTask: undefined,
                preventive: data.preventive,
            });
        }
        for (const user of assignUsers) {
            const count = await getCountSchedulePrevetiveTaskAssignUserByTask(taskIdMap[user.preventiveTask]);
            if (count > 1) {
                throw new ApiError('Một công việc chỉ được phép giao cho 1 kỹ sư thực hiện');
            }
            // nếu user có trường task cũ (preventiveTask) thì ánh xạ sang task mới
            await SchedulePreventiveTaskAssignUserModel.create({
                ...user,
                schedulePreventive: schedulePreventive._id,
                schedulePreventiveTask: taskIdMap[user.preventiveTask], // 💡 thêm dòng này
                _id: undefined,
                preventive: data.preventive,
            });
        }
        // Copy Comments
        // eslint-disable-next-line no-restricted-syntax
        for (const comment of comments) {
            // eslint-disable-next-line no-await-in-loop
            await SchedulePreventiveCommentModel.create({
                ...comment,
                schedulePreventive: schedulePreventive.id,
                _id: undefined,
                preventive: data.preventive,
            });
        }
        // Copy Spare Parts
        // eslint-disable-next-line no-restricted-syntax
        for (const part of spareParts) {
            // eslint-disable-next-line no-await-in-loop
            await SchedulePreventiveSparePartModel.create({
                ...part,
                schedulePreventive: schedulePreventive.id,
                _id: undefined,
                preventive: data.preventive,
            });
        }
    }
    return schedulePreventive;
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
const querySchedulePreventives = async (filter, options, req) => {
    const now = new Date();
    const schedulePreventiveFilter = {};
    const schedulePeventiveMatch = {};
    // kiểm tra xem có được xem tất cả tài sản không
    let allowViewAll = true;
    if (req.companySetting.filterByAccount) {
        const dep = await Department.findById(req.user.department).select('allowViewAll');
        allowViewAll = dep?.allowViewAll;
    }
    if (!allowViewAll) {
        schedulePeventiveMatch['assetMaintenance.department'] = mongoose.Types.ObjectId(req?.user?.department);
    }
    if (filter.searchText) {
        const regex = { $regex: filter.searchText, $options: 'i' };

        schedulePeventiveMatch.$or = [
            { code: regex },
            { 'preventive.preventiveName': regex },
            { 'assetMaintenance.serial': regex },
            { 'assetMaintenance.assetModel.assetModelName': regex },
            { 'assetMaintenance.assetModel.asset.assetName': regex },
        ];

        delete filter.searchText;
    }

    if (filter.code) {
        schedulePreventiveFilter.code = { $regex: filter.code, $options: 'i' };
    }
    if (filter.schedulePreventiveStatus) {
        schedulePreventiveFilter.status = filter.schedulePreventiveStatus;
    }
    if (filter.status) {
        schedulePreventiveFilter.status = filter.status;
    }

    if (filter.importance) {
        schedulePreventiveFilter.importance = filter.importance;
        delete filter.importance;
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
        schedulePeventiveMatch.startDate = { ...dateFilter };
    }
    if (filter.assetName) {
        schedulePeventiveMatch['assetMaintenance.assetModel.asset.assetName'] = { $regex: filter.assetName, $options: 'i' };
    }
    if (filter.preventiveName) {
        schedulePeventiveMatch['preventive.preventiveName'] = { $regex: filter.preventiveName, $options: 'i' };
    }
    if (filter.serial) {
        schedulePeventiveMatch['assetMaintenance.serial'] = { $regex: filter.serial, $options: 'i' };
    }
    if (filter.assetStyle) {
        schedulePeventiveMatch['assetMaintenance.assetStyle'] = filter.assetStyle;
    }
    if (filter.assetModelName) {
        schedulePeventiveMatch['assetMaintenance.assetModel.assetModelName'] = {
            $regex: filter.assetModelName,
            $options: 'i',
        };
    }
    if (filter.branchs) {
        const _branchs = filter.branchs.map((_b) => mongoose.Types.ObjectId(_b));
        schedulePeventiveMatch['assetMaintenance.branch'] = {
            $in: _branchs,
        };
    }
    // lỗi đoạn này
    if (filter.ticketStatus) {
        switch (filter.ticketStatus) {
            case ticketSchedulePreventiveStatus.upcoming:
                schedulePreventiveFilter.startDate = {
                    ...(schedulePreventiveFilter.startDate || {}),
                    $gt: new Date(),
                };
                schedulePreventiveFilter.ticketStatus = ticketSchedulePreventiveStatus.new;
                break;
            case ticketSchedulePreventiveStatus.new:
                now.setDate(now.getDate() + 2); // Cộng thêm 2 ngày
                schedulePreventiveFilter.startDate = { $lt: now };
                schedulePreventiveFilter.ticketStatus = ticketSchedulePreventiveStatus.new;
                break;
            case ticketSchedulePreventiveStatus.inProgress:
                // now.setDate(now.getDate() + 2); // Cộng thêm 1 ngày
                // schedulePreventiveFilter.startDate = { $lt: now };
                schedulePreventiveFilter.ticketStatus = ticketSchedulePreventiveStatus.inProgress;
                break;
            case ticketSchedulePreventiveStatus.overdue:
                schedulePreventiveFilter.$expr = {
                    $lt: [
                        {
                            $add: [
                                '$startDate',
                                { $multiply: ['$maintenanceDurationHr', 60 * 60 * 1000] },
                                { $multiply: ['$maintenanceDurationMin', 60 * 1000] },
                            ],
                        },
                        new Date(),
                    ],
                };
                schedulePreventiveFilter.ticketStatus = {
                    $in: [ticketSchedulePreventiveStatus.inProgress, ticketSchedulePreventiveStatus.new],
                };
                break;
            default:
                schedulePreventiveFilter.ticketStatus = ticketSchedulePreventiveStatus.history;
                break;
        }
    }

    const searchAggregaates = [
        {
            $match: schedulePreventiveFilter,
        },
        {
            $lookup: {
                from: 'assetmaintenances',
                localField: 'assetMaintenance',
                foreignField: '_id',
                as: 'assetMaintenance',
                pipeline: [
                    {
                        $lookup: {
                            from: 'assetmodels',
                            localField: 'assetModel',
                            foreignField: '_id',
                            as: 'assetModel',
                            pipeline: [
                                {
                                    $lookup: {
                                        from: 'assets',
                                        localField: 'asset',
                                        foreignField: '_id',
                                        as: 'asset',
                                    },
                                },
                                {
                                    $lookup: {
                                        from: 'categorys',
                                        localField: 'category',
                                        foreignField: '_id',
                                        as: 'category',
                                    },
                                },
                                {
                                    $lookup: {
                                        from: 'manufacturers',
                                        localField: 'manufacturer',
                                        foreignField: '_id',
                                        as: 'manufacturer',
                                    },
                                },

                                { $unwind: { path: '$asset', preserveNullAndEmptyArrays: true } },
                                { $unwind: { path: '$manufacturer', preserveNullAndEmptyArrays: true } },
                                { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
                            ],
                        },
                    },
                    {
                        $lookup: {
                            from: 'customers',
                            localField: 'customer',
                            foreignField: '_id',
                            as: 'customer',
                        },
                    },
                    {
                        $lookup: {
                            from: 'branches',
                            localField: 'branch',
                            foreignField: '_id',
                            as: 'objectBranch',
                        },
                    },
                    {
                        $lookup: {
                            from: 'departments',
                            localField: 'department',
                            foreignField: '_id',
                            as: 'objectDepartments',
                        },
                    },
                    { $unwind: { path: '$objectBranch', preserveNullAndEmptyArrays: true } },
                    { $unwind: { path: '$objectDepartments', preserveNullAndEmptyArrays: true } },
                    { $unwind: { path: '$assetModel', preserveNullAndEmptyArrays: true } },
                    { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } },
                ],
            },
        },
        {
            $lookup: {
                from: 'amcs',
                localField: 'amc',
                foreignField: '_id',
                as: 'amc',
            },
        },
        {
            $lookup: {
                from: 'services',
                localField: 'service',
                foreignField: '_id',
                as: 'service',
            },
        },
        {
            $lookup: {
                from: 'users',
                localField: 'createdBy',
                foreignField: '_id',
                as: 'createdBy',
            },
        },
        {
            $lookup: {
                from: 'preventives',
                localField: 'preventive',
                foreignField: '_id',
                as: 'preventive',
            },
        },
        { $unwind: { path: '$preventive', preserveNullAndEmptyArrays: true } },
        { $unwind: { path: '$createdBy', preserveNullAndEmptyArrays: true } },
        { $unwind: { path: '$amc', preserveNullAndEmptyArrays: true } },
        { $unwind: { path: '$assetMaintenance', preserveNullAndEmptyArrays: true } },
        { $match: schedulePeventiveMatch },
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
    const _schedulePreventives = await SchedulePreventiveModel.aggregate([...searchAggregaates, ...pagzingAggregaates]);
    const countAggregaates = [
        {
            $count: 'totalResults',
        },
    ];
    const totalResults = await SchedulePreventiveModel.aggregate([...searchAggregaates, ...countAggregaates]);
    return {
        _schedulePreventives,
        totalResults: totalResults[0],
    };
};
// const schedulePreventives = await SchedulePreventiveModel.paginate(
//     schedulePreventiveFilter,
//     {
//         ...options,
//         populate: [
//             {
//                 path: 'preventive',
//                 populate: [
//                     {
//                         path: 'assetMaintenance',
//                         populate: [
//                             { path: 'customer', select: 'customerName' },
//                             { path: 'asset', select: 'assetName' },
//                             { path: 'assetModel', select: 'assetModelName' }
//                         ],
//                     },
//                 ],
//             },
//             {
//                 path: 'assetMaintenance',
//                 populate: [
//                     {
//                         path: 'assetModel',
//                         populate: [{ path: 'asset' }]
//                     },
//                     { path: 'customer' },
//                     { path: 'country' },
//                     { path: 'state' },
//                     { path: 'city' },
//                     { path: 'building' },
//                     { path: 'floor' },
//                     { path: 'department' },
//                     { path: 'branch' },
//                 ]
//             },
//             { path: 'amc' },
//             { path: 'service' },
//             { path: 'createdBy' }
//         ],
//     }
// );
//     return schedulePreventives;
// };

/**
 * Get user by id
 * @param {ObjectId} id
 * @returns {Promise<User>}
 */
const getSchedulePreventiveByIdNotPopulate = async (id) => {
    const schedulePreventive = await SchedulePreventiveModel.findById(id);
    return schedulePreventive;
};
const getSchedulePreventiveById = async (id, user) => {
    const schedulePreventive = await SchedulePreventiveModel.findById(id)
        .populate([
            {
                path: 'preventive',
                populate: [
                    {
                        path: 'assetMaintenance',
                        populate: [
                            {
                                path: 'assetModel',
                                populate: [
                                    { path: 'customer' },
                                    { path: 'asset' },
                                    { path: 'category' },
                                    { path: 'manufacturer' },
                                    { path: 'subCategory' },
                                ],
                            },
                            { path: 'customer' },
                        ],
                    },
                ],
            },
            { path: 'amc' },
        ])
        .lean();
    if (!schedulePreventive) return null;

    // Lấy các task liên quan
    const tasks = await SchedulePreventiveTaskModel.find({ schedulePreventive: id, isCancel: false }).lean();
    // Lấy các taskItem liên quan đến các task
    const taskIds = tasks.map((t) => t._id);
    const taskItems = await SchedulePreventiveTaskItemModel.find({ schedulePreventiveTask: { $in: taskIds } }).populate({
        path: 'breakdown',
    });
    const schedulePreventiveTaskAssignUsers = await SchedulePreventiveTaskAssignUserModel.find({
        schedulePreventiveTask: { $in: taskIds },
        isCancel: false,
    }).populate({ path: 'user' });

    // Gắn taskItems vào từng task
    const tasksWithItems = tasks.map((task) => ({
        ...task,
        taskItems: taskItems.filter((item) => String(item.schedulePreventiveTask) === String(task._id)),
        schedulePreventiveTaskAssignUsers: schedulePreventiveTaskAssignUsers.filter(
            (item) => String(item.schedulePreventiveTask) === String(task._id)
        ),
    }));

    return {
        ...schedulePreventive,
        tasks: tasksWithItems,
    };
};
const updateSchedulePreventiveById = async (id, updateBody) => {
    const schedulePreventive = await SchedulePreventiveModel.findById(id);
    if (!schedulePreventive) {
        throw new ApiError(httpStatus.NOT_FOUND, 'SchedulePreventive not found');
    }
    Object.assign(schedulePreventive, updateBody);
    await schedulePreventive.save();
    return schedulePreventive;
};
const deleteSchedulePreventiveById = async (id) => {
    const schedulePreventive = await SchedulePreventiveModel.findById(id);
    if (!schedulePreventive) {
        throw new ApiError(httpStatus.NOT_FOUND, 'SchedulePreventive not found');
    }
    // // đóng lại lịch sử ngừng máy nếu có  (vì chỉ được xóa các bản ghi mới lên chưa cần check)
    // await checkAssetMaintenanceIsNotActiveHistoryCloseWithSchedulePreventive(
    //     schedulePreventive?._id,
    //     schedulePreventive.assetMaintenance
    // );
    await SchedulePreventiveSparePartModel.deleteMany({ schedulePreventive: id });
    await SchedulePreventiveTaskAssignUserModel.deleteMany({ schedulePreventive: id });
    await SchedulePreventiveCommentModel.deleteMany({ schedulePreventive: id });
    // Lấy các PreventiveTask liên quan
    const tasks = await SchedulePreventiveTaskModel.find({ schedulePreventive: id }).select('_id');
    const taskIds = tasks.map((task) => task._id);
    await SchedulePreventiveTaskItemModel.deleteMany({ schedulePreventiveTask: { $in: taskIds } });
    await SchedulePreventiveTaskModel.deleteMany({ schedulePreventive: id });

    await schedulePreventive.remove();
    return schedulePreventive;
};
const deleteManySchedulePreventive = async (filter) => {
    const schedules = await SchedulePreventiveModel.find({
        ...filter,
        status: { $in: schedulePreventiveStatus.new },
        // chỉ xóa những bản ghi chưa được thực hiện và chưa đến ngày làm việc
    }).select('_id');
    const scheduleIds = schedules.map((s) => s._id);
    // Xóa các bảng con liên quan
    await SchedulePreventiveSparePartModel.deleteMany({ schedulePreventive: { $in: scheduleIds } });
    await SchedulePreventiveTaskAssignUserModel.deleteMany({ schedulePreventive: { $in: scheduleIds } });
    await SchedulePreventiveCommentModel.deleteMany({ schedulePreventive: { $in: scheduleIds } });
    const scheduleTasks = await SchedulePreventiveTaskModel.find({ schedulePreventive: { $in: scheduleIds } }).select('_id');
    const scheduleTaskIds = scheduleTasks.map((t) => t._id);
    await SchedulePreventiveTaskItemModel.deleteMany({ schedulePreventiveTask: { $in: scheduleTaskIds } });
    await SchedulePreventiveCheckinCheckOutModel.deleteMany({ schedulePreventive: { $in: scheduleTaskIds } });
    await SchedulePreventiveTaskModel.deleteMany({ schedulePreventive: { $in: scheduleIds } });
    await SchedulePreventiveModel.deleteMany({ _id: { $in: scheduleIds } });
};

const switchToWaitingForAdminApproval = async (_schedulePreventive, _user) => {
    const schedulePreventive = await SchedulePreventiveModel.findById(_schedulePreventive).populate({ path: 'preventive' });
    if (!schedulePreventive) {
        throw new ApiError(httpStatus.NOT_FOUND, 'schedulePreventive not found');
    }
    const schedulePreventiveTasks = await SchedulePreventiveTaskModel.find({
        schedulePreventive: schedulePreventive._id,
        isCancel: false,
    });
    const schedulePreventiveTaskAssignUser = await SchedulePreventiveTaskAssignUserModel.find({
        schedulePreventive: schedulePreventive._id,
        status: { $ne: schedulePreventiveTaskAssignUserStatus.replacement },
        isCancel: false,
    });
    if (!schedulePreventiveTaskAssignUser || schedulePreventiveTaskAssignUser.length === 0) {
        throw new ApiError(httpStatus.NOT_FOUND, 'schedulePreventiveTaskAssignUser not found');
    }
    // Kiểm tra xem có task nào chưa được giao không
    const allTasksAssigned = schedulePreventiveTasks.every((task) =>
        schedulePreventiveTaskAssignUser.some(
            (assign) =>
                assign?.schedulePreventiveTask &&
                task?._id &&
                assign.schedulePreventiveTask.toString() === task._id.toString()
        )
    );

    if (allTasksAssigned === false) {
        return schedulePreventive;
    }
    // Kiểm tra tất cả đã hoàn thành
    const allCompleted = schedulePreventiveTaskAssignUser.every(
        (task) => task.status === schedulePreventiveTaskAssignUserStatus.completed
    );
    if (allCompleted) {
        schedulePreventive.status = schedulePreventiveStatus.waitingForAdminApproval;
        await schedulePreventive.save();
        //lưu vào bảng downtime của thiết bị
        // const payload = {
        //     assetMaintenance: schedulePreventive.assetMaintenance,
        //     origin: schedulePreventive._id,
        //     createdBy: _user,
        //     startDate: schedulePreventive.startDate,
        //     endDate: new Date(),
        //     time: (schedulePreventive.downtimeHr * 60 + schedulePreventive.downtimeMin) * 60 * 1000,
        // };
        // await AssetMaintenanceIsNotActiveHistoryModel.create(payload);
        // lưu lịch sử
        const latestSchedulePreventiveHistory = await getLatestSchedulePreventiveHistory();
        const _payloadHistorySchedulePreventive = {
            schedulePreventive: schedulePreventive._id,
            status: historySchedulePreventiveStatus.waitingForAdminApproval,
            oldStatus: latestSchedulePreventiveHistory.status,
        };
        await createSchedulePreventiveHistory(_payloadHistorySchedulePreventive);

        // lưu vào bảng phê duyệt nhanh
        const assetMaintenance = await AssetMaintenance.findById(schedulePreventive.assetMaintenance);

        const tasks = schedulePreventiveTasks.map((t) => ({
            id: t._id,
            taskName: t.taskName,
        }));

        const schedulePreventiveObj = schedulePreventive.toObject();
        const assetMaintenanceObj = assetMaintenance.toObject();

        await ApprovalTaskModel.create({
            sourceType: approvedTaskType.preventive,
            sourceId: schedulePreventive._id,
            title: 'Duyệt công việc',
            description: `Công việc ${schedulePreventive.code}`,
            data: {
                ...schedulePreventiveObj,
                assetMaintenance: assetMaintenanceObj,
                schedulePreventiveTasks: tasks,
            },
            requestUser: _user,
        });

        // tạo thông báo phê duyệt
        const payloadNoti = {
            notificationTypeCode: notificationTypeCode.approve_maintenance_work,
            isNotifyTheManager: true,
            text: `Công việc bảo trì đã hoàn thành xong. Vui lòng đăng nhập vào bảo trì ${schedulePreventive.code} để phê duyệt !`,
            subUrl: `bao-tri/chi-tiet/${schedulePreventive._id}`,
            webSubUrl: `maintenance/work-order-schedule-preventive/view/${schedulePreventive._id}`,
            notificationName: 'Phê duyệt công việc bảo trì',
        };
        await notificationService.pushNotification(payloadNoti);
    }

    return schedulePreventive;
};

const checkInOutListAndTasks = async (checkInOutList, taskItems, schedulePreventiveTask, _user) => {
    // Thêm mới checkInOutList
    const _schedulePreventiveTask = await SchedulePreventiveTaskModel.findById(schedulePreventiveTask.id);
    if (!_schedulePreventiveTask) {
        throw new ApiError(httpStatus.NOT_FOUND, '_schedulePreventiveTask not found');
    }
    if (checkInOutList.length > 0 && Array.isArray(checkInOutList)) {
        // eslint-disable-next-line no-restricted-syntax
        for (const item of checkInOutList) {
            // eslint-disable-next-line no-await-in-loop
            await SchedulePreventiveCheckinCheckOutModel.create({
                schedulePreventiveTask: schedulePreventiveTask.id,
                checkInDateTime: item.checkInDateTime,
                checkOutDateTime: item.checkOutDateTime,
                user: _user,
            });
        }
    }
    let data = {};
    if (schedulePreventiveTask.downtimeHr !== null || schedulePreventiveTask.downtimeMin !== null) {
        // await SchedulePreventiveTaskModel.findByIdAndUpdate(
        //     schedulePreventiveTask.id,
        //     {
        //         ...schedulePreventiveTask,
        //     },
        //     { new: true }
        // );
        data = { downtimeHr: schedulePreventiveTask.downtimeHr, downtimeMin: schedulePreventiveTask.downtimeMin };
    }
    const _schedulePreventive = await SchedulePreventiveModel.findByIdAndUpdate(
        _schedulePreventiveTask.schedulePreventive,
        {
            ticketStatus: ticketSchedulePreventiveStatus.inProgress,
            status: schedulePreventiveStatus.inProgress,
            ...data,
        },
        { new: true }
    );
    // Update các taskItem trong từng task
    let hasProblem = false;
    if (Array.isArray(taskItems)) {
        // eslint-disable-next-line no-restricted-syntax
        for (const taskItem of taskItems) {
            if (taskItem.taskItemId) {
                let breakdown = null;
                if (taskItem.isProblem === true) {
                    hasProblem = true;
                    const sequenceService = require('../common/sequence.service');
                    const payload = {
                        createdBy: _user,
                        assetMaintenance: _schedulePreventive.assetMaintenance,
                        code: await sequenceService.generateSequenceCode('BREAKDOWN_TIKET'),
                        defectDescription: taskItem.problemComment,
                        schedulePreventiveTaskItem: taskItem.taskItemId,
                        schedulePreventiveTask: schedulePreventiveTask.id,
                    };
                    const breakdownService = require('../common/breakdown.service');
                    breakdown = await breakdownService.createBreakdown(payload);
                    const payloadHistory = {
                        workedDate: Date.now(),
                        status: progressStatus.raised,
                        workedBy: _user,
                        breakdown: breakdown._id,
                        comment: taskItem.problemComment,
                    };
                    await breakdownService.createBreakdownHistory(payloadHistory);
                }
                //  else {
                //     hasProblem = false;
                // }
                const updatePayload = { ...taskItem };
                if (breakdown) updatePayload.breakdown = breakdown._id;
                await SchedulePreventiveTaskItemModel.findByIdAndUpdate(taskItem.taskItemId, updatePayload, { new: true });
                // tạo để lưu lịch sử ngừng máy
                // if (breakdown) {
                //     const assetMaintenanceIsNotActiveHistory =
                //         await assetMaintenanceIsNotActiveHistoryService.assetMaintenanceIsNotActiveHistoryByAssetMaintenance(
                //             _schedulePreventive.assetMaintenance
                //         );
                //     if (assetMaintenanceIsNotActiveHistory.length == 0) {
                //         await assetMaintenanceIsNotActiveHistoryService.createAssetMaintenanceIsNotActiveHistory({
                //             assetMaintenance: _schedulePreventive.assetMaintenance,
                //             startDate: Date.now(),
                //             createdBy: _user,
                //             origin: breakdown._id,
                //         });
                //     }
                // }
            }
        }
    }
    const statusToUpdate = hasProblem
        ? schedulePreventiveTaskAssignUserStatus.partiallyCompleted
        : schedulePreventiveTaskAssignUserStatus.completed;
    await SchedulePreventiveTaskAssignUserModel.findOneAndUpdate(
        { user: _user, schedulePreventiveTask: schedulePreventiveTask.id, isCancel: false },
        { status: statusToUpdate },
        { useFindAndModify: false } // thêm dòng này
    );
    const latestSchedulePreventiveHistory = await getLatestSchedulePreventiveHistory();
    const _payloadHistorySchedulePreventive = {
        schedulePreventive: _schedulePreventive._id,
        schedulePreventiveTask: _schedulePreventiveTask._id,
        createdBy: _user,
        status: statusToUpdate,
        oldStatus: latestSchedulePreventiveHistory.status,
    };
    await createSchedulePreventiveHistory(_payloadHistorySchedulePreventive);
    if (hasProblem === false) {
        await switchToWaitingForAdminApproval(_schedulePreventiveTask.schedulePreventive, _user);
    }
    // Update schedulePreventive
    return { schedulePreventiveTask, hasProblem };
};
const getSchedulePreventiveTaskByRes = async (data) => {
    data.isCancel = false;
    const schedulePreventiveTasks = await SchedulePreventiveTaskModel.find(data).populate({ path: 'amc' });
    return schedulePreventiveTasks;
};
const getSchedulePreventiveTaskItemByRes = async (data) => {
    const schedulePreventiveTaskItems = await SchedulePreventiveTaskItemModel.find(data);
    return schedulePreventiveTaskItems;
};
const getSchedulePreventiveTaskAssignUserByRes = async (data) => {
    data.isCancel = false;
    const preventiveTaskAssignUsers = await SchedulePreventiveTaskAssignUserModel.find(data).populate([
        {
            path: 'user',
        },
        {
            path: 'schedulePreventiveTask',
        },
    ]);
    return preventiveTaskAssignUsers;
};
const getSchedulePreventiveSparePartByRes = async (data) => {
    const preventiveTaskAssignUsers = await SchedulePreventiveSparePartModel.find(data).populate({
        path: 'user',
    });
    return preventiveTaskAssignUsers;
};
const getSchedulePreventiveTaskAssignUserByStatus = async (data) => {
    data.isCancel = false;
    const preventiveTaskAssignUsers = await SchedulePreventiveTaskAssignUserModel.findOne(data).populate([
        {
            path: 'user',
        },
    ]);
    return preventiveTaskAssignUsers;
};
const schedulePreventiveTaskAssignUser = async (
    _schedulePreventive,
    _schedulePreventiveTask,
    _user,
    _reassignUser,
    createdBy
) => {
    // check thằng cũ có đang checkin k, nếu có thì checkout
    const currentCheckinCheckout = await getCurrentCheckinCheckout(_reassignUser);
    if (currentCheckinCheckout) {
        currentCheckinCheckout.checkOutDateTime = new Date();
        currentCheckinCheckout.comment = 'Hệ thống tự động checkout do chuyển công việc';
        await currentCheckinCheckout.save();
    }
    // tìm xem thằng cũ tồn tại không
    if (_user === _reassignUser) {
        const reassignUserSchedulePreventiveTaskAssignUser = await SchedulePreventiveTaskAssignUserModel.findOne({
            schedulePreventiveTask: _schedulePreventiveTask,
            user: _reassignUser,
            isCancel: false,
        });
        if (
            reassignUserSchedulePreventiveTaskAssignUser &&
            (reassignUserSchedulePreventiveTaskAssignUser.status === schedulePreventiveTaskAssignUserStatus.reassignment ||
                reassignUserSchedulePreventiveTaskAssignUser.status === schedulePreventiveTaskAssignUserStatus.reopen)
        ) {
            const schedulePreventiveReplacement = await SchedulePreventiveTaskAssignUserModel.findOneAndUpdate(
                { _id: reassignUserSchedulePreventiveTaskAssignUser._id, isCancel: false },
                { status: schedulePreventiveTaskAssignUserStatus.assigned }
            );
            return schedulePreventiveReplacement;
        }
    }
    // chuyen thang cu ve replace
    await SchedulePreventiveTaskAssignUserModel.findOneAndUpdate(
        {
            schedulePreventiveTask: _schedulePreventiveTask,
            user: _reassignUser,
            isCancel: false,
        },
        { status: schedulePreventiveTaskAssignUserStatus.replacement },
        { new: true }
    );

    const _schedulePreventiveTaskAssignUser = await SchedulePreventiveTaskAssignUserModel.findOne({
        schedulePreventiveTask: _schedulePreventiveTask,
        user: _user,
        isCancel: false,
    });
    if (_schedulePreventiveTaskAssignUser) {
        // check
        const schedulePreventiveTaskAssigned = await SchedulePreventiveTaskAssignUserModel.findOneAndUpdate(
            { _id: _schedulePreventiveTaskAssignUser._id, isCancel: false },
            { status: schedulePreventiveTaskAssignUserStatus.assigned }
        );
        return schedulePreventiveTaskAssigned;
    }
    const count = await getCountSchedulePrevetiveTaskAssignUserByTask(_schedulePreventiveTask);
    if (count > 1) {
        throw new ApiError('Một công việc chỉ được phép giao cho 1 kỹ sư thực hiện');
    }
    const createSchedulePreventiveTask = await SchedulePreventiveTaskAssignUserModel.create({
        schedulePreventiveTask: _schedulePreventiveTask,
        user: _user,
        schedulePreventive: _schedulePreventive,
    });
    const schedulePreventiveModel = await SchedulePreventiveModel.findById(_schedulePreventive);

    const payloadNoti = {
        notificationTypeCode: notificationTypeCode.assign_user_schedule_preventive,
        text: `Bạn nhận được công việc mới: ${schedulePreventiveModel.code}`,
        subUrl: `cong-viec/chi-tiet/${createSchedulePreventiveTask.id}`,
        webSubUrl: `maintenance/work-order-schedule-preventive/view/${schedulePreventiveModel._id}`,
        notificationName: 'Bạn nhận được lịch bảo trì mới',
        user: _user,
    };
    await notificationService.pushNotificationWithUser(payloadNoti);
    // lưu lịch sử
    const latestSchedulePreventiveHistory = await getLatestSchedulePreventiveHistory();
    const _payloadHistorySchedulePreventive = {
        schedulePreventive: _schedulePreventive,
        schedulePreventiveTask: _schedulePreventiveTask,
        status: historySchedulePreventiveStatus.assigned,
        createdBy,
        assignedTo: _user,
        oldStatus: latestSchedulePreventiveHistory.status,
    };
    await createSchedulePreventiveHistory(_payloadHistorySchedulePreventive);
    return createSchedulePreventiveTask;
};
const createSchedulePreventiveComment = async (schedulepreventiveComment) => {
    const _createSchedulepreventiveComment = await SchedulePreventiveCommentModel.create(schedulepreventiveComment);
    return _createSchedulepreventiveComment;
};
const updateCustomerSchedulePreventive = async () => {
    const schedulePreventives = await SchedulePreventiveModel.find();
    for (let i = 0; i < schedulePreventives.length; i++) {
        const schedulePreventive = schedulePreventives[i];
        const assetMaintenance = await AssetMaintenance.findById(schedulePreventive.assetMaintenance);
        if (!assetMaintenance) {
            continue; // nếu không tìm thấy, bỏ qua
        }
        await SchedulePreventiveModel.findByIdAndUpdate(schedulePreventive._id, {
            customer: assetMaintenance.customer,
        });
    }
    const preventives = await PreventiveModel.find();
    for (let i = 0; i < preventives.length; i++) {
        const schedulePreventive = preventives[i];
        const assetMaintenance = await AssetMaintenance.findById(schedulePreventive.assetMaintenance);
        if (!assetMaintenance) {
            continue; // nếu không tìm thấy, bỏ qua
        }
        await PreventiveModel.findByIdAndUpdate(schedulePreventive._id, {
            customer: assetMaintenance.customer,
        });
    }
    const breakdowns = await Breakdown.find();
    for (let i = 0; i < breakdowns.length; i++) {
        const schedulePreventive = breakdowns[i];
        const assetMaintenance = await AssetMaintenance.findById(schedulePreventive.assetMaintenance);
        if (!assetMaintenance) {
            continue; // nếu không tìm thấy, bỏ qua
        }
        await Breakdown.findByIdAndUpdate(schedulePreventive._id, {
            customer: assetMaintenance.customer,
        });
    }
    return 'ok';
};
const queryMySchedulePreventives = async (filter, options, user) => {
    // updateCustomerSchedulePreventive();
    const mySchedulePreventiveFilter = filter;
    mySchedulePreventiveFilter.isCancel = false;
    const schedulePreventiveMatch = {};
    // Tìm kiếm chung theo nhiều trường
    if (filter.searchText && typeof filter.searchText === 'string') {
        const keyword = filter.searchText.trim();

        schedulePreventiveMatch.$or = [
            { 'schedulePreventive.code': { $regex: keyword, $options: 'i' } },
            { 'schedulePreventiveTask.taskName': { $regex: keyword, $options: 'i' } },
            { 'schedulePreventive.assetMaintenance.serial': { $regex: keyword, $options: 'i' } },
            { 'schedulePreventive.assetMaintenance.assetModel.asset.assetName': { $regex: keyword, $options: 'i' } },
            { 'schedulePreventive.assetMaintenance.assetModel.assetModelName': { $regex: keyword, $options: 'i' } },
        ];

        delete filter.searchText;
    }

    if (user) {
        mySchedulePreventiveFilter.user = Types.ObjectId(user);
    }
    if (filter.taskName) {
        schedulePreventiveMatch['schedulePreventiveTask.taskName'] = {
            $regex: filter.taskName,
            $options: 'i', // không phân biệt hoa thường
        };
        delete filter.taskName;
    }
    if (filter.startDate || filter.endDate) {
        const range = {};
        if (filter.startDate) range.$gte = new Date(filter.startDate);
        if (filter.endDate) range.$lte = new Date(filter.endDate);
        schedulePreventiveMatch['startDate'] = range;
        delete filter.startDate;
        delete filter.endDate;
    }
    if (filter.schedulePreventiveTaskAssignUserStatuses) {
        mySchedulePreventiveFilter.status = { $in: filter.schedulePreventiveTaskAssignUserStatuses };
    }
    if (filter.schedulePreventiveTaskAssignUserStatus) {
        mySchedulePreventiveFilter.status = filter.schedulePreventiveTaskAssignUserStatus;
        delete filter.schedulePreventiveTaskAssignUserStatus;
    }
    if (filter.code) {
        schedulePreventiveMatch['schedulePreventive.code'] = {
            $regex: filter.code,
            $options: 'i', // không phân biệt hoa thường
        };
        delete filter.code;
    }
    if (filter.importance) {
        schedulePreventiveMatch['schedulePreventive.importance'] = filter.importance;
        delete filter.importance;
    }
    if (filter.serial) {
        schedulePreventiveMatch['schedulePreventive.assetMaintenance.serial'] = {
            $regex: filter.serial,
            $options: 'i', // không phân biệt hoa thường
        };
        delete filter.serial;
    }
    if (filter.assetName) {
        schedulePreventiveMatch['schedulePreventive.assetMaintenance.assetModel.asset.assetName'] = {
            $regex: filter.assetName,
            $options: 'i', // không phân biệt hoa thường
        };
        delete filter.assetName;
    }
    if (filter.assetModelName) {
        schedulePreventiveMatch['schedulePreventive.assetMaintenance.assetModel.assetModelName'] = {
            $regex: filter.assetModelName,
            $options: 'i', // không phân biệt hoa thường
        };
        delete filter.assetModelName;
    }
    if (filter.branchs) {
        const _branchs = filter.branchs.map((_b) => mongoose.Types.ObjectId(_b));
        schedulePreventiveMatch['schedulePreventive.assetMaintenance.branch'] = {
            $in: _branchs,
        };
    }
    delete filter.branchs;
    switch (filter.ticketSchedulePreventiveTaskAssignUserStatus) {
        case ticketSchedulePreventiveStatus.upcoming:
            schedulePreventiveMatch['schedulePreventive.startDate'] = { $gt: new Date() };
            break;
        // check trước bao lâu
        case ticketSchedulePreventiveStatus.new:
            // case ticketSchedulePreventiveStatus.inProgress:
            const twoDaysAgo = new Date();
            twoDaysAgo.setDate(twoDaysAgo.getDate() + 2);
            schedulePreventiveMatch['schedulePreventive.startDate'] = { $lt: twoDaysAgo };
            break;
        case ticketSchedulePreventiveStatus.overdue:
            schedulePreventiveMatch.$expr = {
                $lt: [
                    {
                        $add: [
                            '$schedulePreventive.startDate',
                            { $multiply: ['$schedulePreventive.maintenanceDurationHr', 60 * 60 * 1000] },
                            { $multiply: ['$schedulePreventive.maintenanceDurationMin', 60 * 1000] },
                        ],
                    },
                    new Date(),
                ],
            };
        default:
            break;
    }
    delete filter.schedulePreventiveTaskAssignUserStatuses;
    delete filter.ticketSchedulePreventiveTaskAssignUserStatus;
    const searchAggregaates = [
        {
            $match: mySchedulePreventiveFilter,
        },
        {
            $lookup: {
                from: 'assetmaintenances',
                localField: 'schedulePreventive.assetMaintenance',
                foreignField: '_id',
                as: 'assetMaintenance',
            },
        },
        {
            $lookup: {
                from: 'schedulepreventivetasks',
                localField: 'schedulePreventiveTask',
                foreignField: '_id',
                as: 'schedulePreventiveTask',
            },
        },
        {
            $lookup: {
                from: 'users',
                localField: 'user',
                foreignField: '_id',
                as: 'user',
            },
        },
        {
            $lookup: {
                from: 'schedulepreventives',
                localField: 'schedulePreventive',
                foreignField: '_id',
                as: 'schedulePreventive',
                pipeline: [
                    {
                        $lookup: {
                            from: 'assetmaintenances',
                            localField: 'assetMaintenance',
                            foreignField: '_id',
                            as: 'assetMaintenance',
                            pipeline: [
                                {
                                    $lookup: {
                                        from: 'assetmodels',
                                        localField: 'assetModel',
                                        foreignField: '_id',
                                        as: 'assetModel',
                                        pipeline: [
                                            {
                                                $lookup: {
                                                    from: 'assets',
                                                    localField: 'asset',
                                                    foreignField: '_id',
                                                    as: 'asset',
                                                },
                                            },
                                            { $unwind: { path: '$asset', preserveNullAndEmptyArrays: true } },
                                        ],
                                    },
                                },
                                {
                                    $lookup: {
                                        from: 'customers',
                                        localField: 'customer',
                                        foreignField: '_id',
                                        as: 'customer',
                                    },
                                },
                                {
                                    $lookup: {
                                        from: 'branches',
                                        localField: 'branch',
                                        foreignField: '_id',
                                        as: 'objectBranch',
                                    },
                                },
                                {
                                    $lookup: {
                                        from: 'departments',
                                        localField: 'department',
                                        foreignField: '_id',
                                        as: 'objectDepartments',
                                    },
                                },
                                { $unwind: { path: '$objectBranch', preserveNullAndEmptyArrays: true } },
                                { $unwind: { path: '$objectDepartments', preserveNullAndEmptyArrays: true } },
                                { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } },
                                { $unwind: { path: '$assetModel', preserveNullAndEmptyArrays: true } },
                            ],
                        },
                    },
                    {
                        $lookup: {
                            from: 'preventives',
                            localField: 'preventive',
                            foreignField: '_id',
                            as: 'preventive',
                        },
                    },
                    { $unwind: { path: '$preventive', preserveNullAndEmptyArrays: true } },
                    { $unwind: { path: '$assetMaintenance', preserveNullAndEmptyArrays: true } },
                ],
            },
        },
        { $unwind: { path: '$schedulePreventiveTask' } },
        { $unwind: { path: '$assetMaintenance', preserveNullAndEmptyArrays: true } },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        { $unwind: { path: '$schedulePreventive', preserveNullAndEmptyArrays: false } },
        {
            $addFields: {
                startDate: '$schedulePreventive.startDate',
            },
        },
        { $match: schedulePreventiveMatch },
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
    const mySchedulePreventives = await SchedulePreventiveTaskAssignUserModel.aggregate([
        ...searchAggregaates,
        ...pagzingAggregaates,
    ]);
    const countAggregaates = [
        {
            $count: 'totalResults',
        },
    ];
    const totalResults = await SchedulePreventiveTaskAssignUserModel.aggregate([...searchAggregaates, ...countAggregaates]);
    return {
        mySchedulePreventives,
        totalResults: totalResults[0],
    };
};
const getSchedulePreventiveTaskAssignUserById = async (id) => {
    const _schedulePreventiveTaskAssignUser = await SchedulePreventiveTaskAssignUserModel.findById(id).populate([
        {
            path: 'schedulePreventive',
            populate: [
                {
                    path: 'assetMaintenance',
                    populate: [
                        { path: 'customer' },
                        {
                            path: 'assetModel',
                            populate: [
                                {
                                    path: 'asset',
                                },
                                {
                                    path: 'assetTypeCategory',
                                },
                                {
                                    path: 'category',
                                },
                                {
                                    path: 'manufacturer',
                                },
                                {
                                    path: 'subCategory',
                                },
                                {
                                    path: 'supplier',
                                },
                                {
                                    path: 'supplier',
                                },
                            ],
                        },
                    ],
                },
                { path: 'preventive' },
            ],
        },
        {
            path: 'schedulePreventiveTask',
            populate: [
                {
                    path: 'amc',
                },
            ],
        },
        {
            path: 'user',
        },
    ]);

    return _schedulePreventiveTaskAssignUser;
};

const getSchedulePreventiveTaskItemByResAndPopulate = async (data) => {
    const schedulePreventiveTaskItems = await SchedulePreventiveTaskItemModel.find(data).populate({
        path: 'schedulePreventiveTask',
    });
    return schedulePreventiveTaskItems;
};
const checkAssetMaintenanceIsNotActiveHistoryCloseWithSchedulePreventive = async (
    schedulePreventiveId,
    assetMaintenance
) => {
    const assetMaintenanceService = require('../common/assetMaintenance.service');
    const totalTask = await assetMaintenanceService.getConutTaskAssetMaintenance(assetMaintenance);
    if (totalTask <= 1) {
        const condition = {
            assetMaintenance: assetMaintenance,
            endDate: null,
        };
        // check có record do chính breakdown này tạo không
        const existed = await AssetMaintenanceIsNotActiveHistoryModel.exists({
            ...condition,
            origin: schedulePreventiveId,
        });
        if (existed) {
            // xóa luôn (không cần find trước)
            await AssetMaintenanceIsNotActiveHistoryModel.deleteMany({
                ...condition,
                origin: schedulePreventiveId,
            });
        } else {
            // đóng record hiện tại
            await AssetMaintenanceIsNotActiveHistoryModel.updateOne(condition, { $set: { endDate: new Date() } });
        }
    }
};
const comfirmCancelSchedulePreventive = async (id, _schedulePreventive, _user) => {
    const schedulePreventive = await SchedulePreventiveModel.findById(id);
    if (!schedulePreventive) {
        throw new ApiError(httpStatus.NOT_FOUND, 'SchedulePreventive not found');
    }
    if (schedulePreventive.ticketStatus !== ticketSchedulePreventiveStatus.new) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Trạng thái này không được hủy !');
    }
    // // đóng lại lịch sử ngừng máy nếu có  (vì chỉ được xóa các bản ghi mới lên chưa cần check)
    // await checkAssetMaintenanceIsNotActiveHistoryCloseWithSchedulePreventive(
    //     schedulePreventive?._id,
    //     schedulePreventive.assetMaintenance
    // );
    const _schedulePreventiveTaskAssignUser = await SchedulePreventiveTaskAssignUserModel.find({
        schedulePreventive: schedulePreventive._id,
        isCancel: false,
    });
    if (_schedulePreventiveTaskAssignUser && _schedulePreventiveTaskAssignUser.length > 0) {
        await SchedulePreventiveTaskAssignUserModel.updateMany(
            { schedulePreventive: schedulePreventive._id, isCancel: false },
            { $set: { status: schedulePreventiveStatus.cancelled } }
        );
    }
    Object.assign(schedulePreventive, _schedulePreventive);
    await schedulePreventive.save();
    // lưu lịch sửa
    const latestSchedulePreventiveHistory = await getLatestSchedulePreventiveHistory();
    const _payloadHistorySchedulePreventive = {
        schedulePreventive: schedulePreventive._id,
        status: historySchedulePreventiveStatus.cancelled,
        createdBy: _user,
        oldStatus: latestSchedulePreventiveHistory.status,
    };
    await createSchedulePreventiveHistory(_payloadHistorySchedulePreventive);
    return schedulePreventive;
};
const comfirmCloseSchedulePreventive = async (schedulePreventiveId, _user, commentClose, closeSignature, listResource) => {
    const schedulePreventive = await SchedulePreventiveModel.findById(schedulePreventiveId);
    if (!schedulePreventive) {
        throw new ApiError(httpStatus.NOT_FOUND, 'SchedulePreventive not found');
    }
    const assetMaintenanceService = require('../common/assetMaintenance.service');
    const totalTask = await assetMaintenanceService.getConutTaskAssetMaintenance(schedulePreventive.assetMaintenance);
    // console.log('totalTask', totalTask);
    if (totalTask <= 1) {
        const now = new Date();
        const data = await AssetMaintenanceIsNotActiveHistoryModel.findOne({
            assetMaintenance: schedulePreventive.assetMaintenance,
            endDate: null,
        });
        if (data) {
            //  chỉ còn 1 mình bảo trì này, Nếu nó thực lichjsk sử, sẽ lấy, còn không có thì nó là hoàn thnahf từ trên web sẽ thấy thười gian nhập
            await AssetMaintenanceIsNotActiveHistoryModel.findOneAndUpdate(
                {
                    assetMaintenance: schedulePreventive.assetMaintenance,
                    endDate: null,
                },
                [
                    {
                        $set: {
                            endDate: now,
                            time: { $subtract: [now, '$startDate'] },
                            closedSource: schedulePreventive._id,
                        },
                    },
                ]
            );
        } else {
            const payload = {
                assetMaintenance: schedulePreventive.assetMaintenance,
                origin: schedulePreventive._id,
                createdBy: _user,
                startDate: schedulePreventive.startDate,
                endDate: new Date(),
                time: (schedulePreventive.downtimeHr * 60 + schedulePreventive.downtimeMin) * 60 * 1000,
                closedSource: schedulePreventive._id,
            };
            await AssetMaintenanceIsNotActiveHistoryModel.create(payload);
        }
    }
    const payload = {
        ticketStatus: ticketSchedulePreventiveStatus.history,
        status: schedulePreventiveStatus.completed,
        closingDate: Date.now(),
        commentClose: commentClose,
        closeSignature: closeSignature,
    };
    Object.assign(schedulePreventive, payload);
    await schedulePreventive.save();
    // lưu lịch sửa
    const latestSchedulePreventiveHistory = await getLatestSchedulePreventiveHistory();
    const _payloadHistorySchedulePreventive = {
        schedulePreventive: schedulePreventive._id,
        status: historySchedulePreventiveStatus.closed,
        createdBy: _user,
        oldStatus: latestSchedulePreventiveHistory.status,
    };
    await createSchedulePreventiveHistory(_payloadHistorySchedulePreventive);
    // lưu các tài liệu của bảo trì khi đóng
    if (listResource && listResource.length > 0) {
        for (const item of listResource) {
            // eslint-disable-next-line no-await-in-loop
            await SchedulePreventiveDocumentsModel.create({ ...item, schedulePreventive: schedulePreventive?._id });
        }
    }
    return schedulePreventive;
};
const comfirmReOpenSchedulePreventive = async (schedulePreventiveId, schedulePreventiveTaskId, _user) => {
    const schedulePreventive = await SchedulePreventiveModel.findById(schedulePreventiveId);
    if (!schedulePreventive) {
        throw new ApiError(httpStatus.NOT_FOUND, 'SchedulePreventive not found');
    }
    const payload = {
        ticketStatus: ticketSchedulePreventiveStatus.inProgress,
        status: schedulePreventiveStatus.inProgress,
    };
    // nếu mà truyền schedulePreventiveTaskId  về thì sẽ reOpen 1 công việc đó
    if (schedulePreventiveTaskId) {
        await SchedulePreventiveTaskAssignUserModel.findOneAndUpdate(
            {
                schedulePreventiveTask: schedulePreventiveTaskId,
                status: schedulePreventiveTaskAssignUserStatus.completed,
                isCancel: false,
            },
            { status: schedulePreventiveTaskAssignUserStatus.reopen }
        );
    } else {
        // nếu mà reOpen cả
        await SchedulePreventiveTaskAssignUserModel.updateMany(
            {
                schedulePreventive: schedulePreventiveId,
                status: schedulePreventiveTaskAssignUserStatus.completed,
                isCancel: false,
            },
            {
                status: schedulePreventiveTaskAssignUserStatus.reopen,
            }
        );
    }
    Object.assign(schedulePreventive, payload);
    await schedulePreventive.save();
    // lưu lịch sửa
    const latestSchedulePreventiveHistory = await getLatestSchedulePreventiveHistory();
    const _payloadHistorySchedulePreventive = {
        schedulePreventive: schedulePreventive._id,
        status: historySchedulePreventiveStatus.reopen,
        createdBy: _user,
        oldStatus: latestSchedulePreventiveHistory.status,
    };
    await createSchedulePreventiveHistory(_payloadHistorySchedulePreventive);
    return schedulePreventive;
};
const getCurrentCheckinCheckout = async (userId) => {
    const schedulePreventiveCheckinCheckout = await SchedulePreventiveCheckinCheckOutModel.findOne({
        user: userId,
        checkOutDateTime: null,
    }).populate([
        {
            path: 'schedulePreventiveTask',
            populate: [
                {
                    path: 'schedulePreventive',
                    populate: [
                        {
                            path: 'preventive',
                        },
                    ],
                },
            ],
        },
    ]);
    const preventive = schedulePreventiveCheckinCheckout?.schedulePreventiveTask?.schedulePreventive?.preventive;
    // console.log(schedulePreventiveCheckinCheckout?.schedulePreventiveTask?.schedulePreventive?.preventive);
    if (preventive && !schedulePreventiveCheckinCheckout.schedulePreventiveTask.incidentDeadline) {
        const deadline = new Date();
        if (preventive.maintenanceDurationMin > 0 || preventive.maintenanceDurationHr > 0) {
            deadline.setHours(deadline.getHours() + preventive.maintenanceDurationHr);
            deadline.setMinutes(deadline.getMinutes() + preventive.maintenanceDurationMin);
        } else {
            // nếu quá 10h đêm thì chuyển thành cuối ngày hôm sau
            if (deadline.getHours() >= 22) {
                deadline.setDate(deadline.getDate() + 1);
            }
            // trường hợp cả 2 đều bằng 0 hoặc không có: đặt là cuối ngày hôm nay (23:59:59)
            deadline.setHours(23, 59, 59, 999);
        }
        await SchedulePreventiveTaskModel.findByIdAndUpdate(
            schedulePreventiveCheckinCheckout?.schedulePreventiveTask?._id,
            {
                $set: { incidentDeadline: deadline },
            },
            { new: true }
        );
    }
    return schedulePreventiveCheckinCheckout;
};
const checkinSchedulePreventiveTask = async (schedulePreventiveTaskId, userId) => {
    const schedulePreventiveCheckinCheckout = await SchedulePreventiveCheckinCheckOutModel.create({
        user: userId,
        checkInDateTime: new Date(),
        schedulePreventiveTask: schedulePreventiveTaskId,
    });

    const schedulePreventiveTaskAssign = await SchedulePreventiveTaskAssignUserModel.find({
        schedulePreventiveTask: schedulePreventiveTaskId,
        user: userId,
        isCancel: false,
    });
    // chuyển trạng thái sang đang tiến hành nếu không ở trạng thái chờ gửi phụ tùng
    if (schedulePreventiveTaskAssign[0].status !== schedulePreventiveTaskAssignUserStatus.pendingApproval) {
        const schedulePreventiveTaskAssignUser = await SchedulePreventiveTaskAssignUserModel.findOneAndUpdate(
            { schedulePreventiveTask: schedulePreventiveTaskId, user: userId, isCancel: false },
            {
                $set: { status: schedulePreventiveTaskAssignUserStatus.inProgress },
            }
        );
        await SchedulePreventiveModel.findByIdAndUpdate(schedulePreventiveTaskAssignUser.schedulePreventive, {
            status: schedulePreventiveStatus.inProgress,
            ticketStatus: ticketSchedulePreventiveStatus.inProgress,
        });
    }
    const schedulePreventiveTask = await SchedulePreventiveTaskModel.findById(schedulePreventiveTaskId);
    if (schedulePreventiveTask && schedulePreventiveTask.schedulePreventive) {
        const schedulePreventive = await SchedulePreventiveModel.findById(schedulePreventiveTask.schedulePreventive);
        // thêm mới lịch sử ngừng máy
        const assetMaintenanceIsNotActiveHistory =
            await assetMaintenanceIsNotActiveHistoryService.assetMaintenanceIsNotActiveHistoryByAssetMaintenance(
                schedulePreventive.assetMaintenance
            );
        if (assetMaintenanceIsNotActiveHistory.length == 0) {
            await assetMaintenanceIsNotActiveHistoryService.createAssetMaintenanceIsNotActiveHistory({
                assetMaintenance: schedulePreventive.assetMaintenance,
                startDate: new Date(),
                createdBy: userId,
                origin: schedulePreventive?._id,
            });
        }
    }
    return schedulePreventiveCheckinCheckout;
};
const checkOutSchedulePreventiveTask = async (schedulePreventiveCheckinCheckOutId, comment, userId) => {
    const schedulePreventiveCheckinCheckout = await SchedulePreventiveCheckinCheckOutModel.findById(
        schedulePreventiveCheckinCheckOutId
    );
    if (!schedulePreventiveCheckinCheckout || schedulePreventiveCheckinCheckout.checkOutDateTime) {
        throw new ApiError(httpStatus.NOT_FOUND, 'SchedulePreventiveCheckinCheckOut not found');
    }
    await SchedulePreventiveCheckinCheckOutModel.findByIdAndUpdate(schedulePreventiveCheckinCheckOutId, {
        comment: comment,
        checkOutDateTime: new Date(),
    });
    return schedulePreventiveCheckinCheckout;
};
const getLastShedulePreventCheckInCheckOutByTaskId = async (schedulePreventiveTaskId) => {
    const lastSchedulePreventiveCheckinCheckout = await SchedulePreventiveCheckinCheckOutModel.findOne({
        schedulePreventiveTask: schedulePreventiveTaskId,
    }).sort({ checkInDateTime: -1 });
    return lastSchedulePreventiveCheckinCheckout;
};

const getSchedulePreventiveHistorys = async (schedulePreventiveId) => {
    const _schedulePreventiveHistorys = await SchedulePreventiveHistoryModel.find({
        schedulePreventive: schedulePreventiveId,
    })
        .sort({ createdAt: -1 })
        .populate([
            { path: 'createdBy' },
            { path: 'assignedTo' },
            {
                path: 'schedulePreventive',
                populate: [{ path: 'preventive' }],
            },
            { path: 'schedulePreventiveTask' },
        ]);
    return _schedulePreventiveHistorys;
};
const startWorkschedulePreventiveTask = async (taskItems, schedulePreventiveTask, _user, signature) => {
    // Thêm mới checkInOutList
    const _schedulePreventiveTask = await SchedulePreventiveTaskModel.findById(schedulePreventiveTask.id);
    if (!_schedulePreventiveTask) {
        throw new ApiError(httpStatus.NOT_FOUND, '_schedulePreventiveTask not found');
    }
    // kiểm tra xem user đã logout ra chưa
    const currentCheckinCheckout = await getCurrentCheckinCheckout(_user);
    if (!currentCheckinCheckout) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Kỹ thuật viên chưa bắt đầu công việc');
    }
    if (currentCheckinCheckout.schedulePreventiveTask.id !== schedulePreventiveTask.id) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Kỹ thuật viên đang ở công việc khác');
    }
    // logout
    await checkOutSchedulePreventiveTask(currentCheckinCheckout.id);
    // cập nhật chữ kỹ
    await SchedulePreventiveTaskAssignUserModel.findOneAndUpdate(
        {
            schedulePreventiveTask: schedulePreventiveTask.id,
            user: _user,
            isCancel: false,
        },
        {
            $set: {
                signature: signature,
                signatoryIsName: schedulePreventiveTask?.signatoryIsName,
                completedDate: new Date(),
            },
        }
    );
    const { _schedulePreventiveTaskUpdate, hasProblem } = await checkInOutListAndTasks(
        [],
        taskItems,
        schedulePreventiveTask,
        _user
    );
    return { _schedulePreventiveTaskUpdate, hasProblem, _schedulePreventiveTask };
};
const checkSkipSchedulePreventive = async () => {
    // const filter = {};
    // filter.$expr = {
    //     $lt: [
    //         {
    //             $add: [
    //                 "$startDate",
    //                 { $multiply: ["$maintenanceDurationHr", 60 * 60 * 1000] }, // nếu hết đến thời gian bắt đầu + thời gian làm việc mà chưa làm gì thì chuyển thành bỏ qua
    //                 { $multiply: ["$maintenanceDurationMin", 60 * 1000] },
    //                 30 * 60 * 1000 // cộng thêm 30 phút
    //             ]
    //         },
    //         new Date()
    //     ]
    // };
    // const schedulePreventiveTaskAssignUser
    // const schedulePreventives = await SchedulePreventiveModel.find(filter);
};
const getTotalSchedulePreventiveStatus = async (filter, req) => {
    const filterMatch = {};
    // kiểm tra xem có được xem tất cả tài sản không
    let allowViewAll = true;
    if (req.companySetting.filterByAccount) {
        const dep = await Department.findById(req.user.department).select('allowViewAll');
        allowViewAll = dep?.allowViewAll;
    }
    const amQuery = {};
    if (filter.branchs && Array.isArray(filter.branchs) && filter.branchs.length > 0) {
        amQuery.branch = { $in: filter.branchs.map((id) => Types.ObjectId(id)) };
    }
    if (!allowViewAll) {
        amQuery.department = Types.ObjectId(req?.user?.department);
    }

    if (Object.keys(amQuery).length > 0) {
        const validAssetMaintenances = await AssetMaintenance.find(amQuery).select('_id');
        const amIds = validAssetMaintenances.map((asset) => asset._id);
        filterMatch.assetMaintenance = { $in: amIds };
    }
    const nowTow = new Date();
    nowTow.setDate(nowTow.getDate() + 2);
    const totalSchedulePreventiveTicketStatusNews = await SchedulePreventiveModel.countDocuments({
        ticketStatus: ticketSchedulePreventiveStatus.new,
        startDate: { $lt: nowTow },
        ...filterMatch,
    });
    const totalSchedulePreventiveTicketStatusInProgress = await SchedulePreventiveModel.countDocuments({
        ticketStatus: ticketSchedulePreventiveStatus.inProgress,
        ...filterMatch,
    });
    const totalSchedulePreventiveTicketStatusUpcomings = await SchedulePreventiveModel.countDocuments({
        ticketStatus: ticketSchedulePreventiveStatus.new,
        startDate: { $gt: new Date() },
        ...filterMatch,
    });

    const OVERDUE_STATUS = [ticketSchedulePreventiveStatus.new, ticketSchedulePreventiveStatus.inProgress];
    const totalSchedulePreventiveStatusOverdues = await SchedulePreventiveModel.countDocuments({
        startDate: {
            $lt: [
                {
                    $add: [
                        '$startDate',
                        { $multiply: ['$maintenanceDurationHr', 60 * 60 * 1000] },
                        { $multiply: ['$maintenanceDurationMin', 60 * 1000] },
                    ],
                },
                new Date(),
            ],
        },
        ticketStatus: { $in: OVERDUE_STATUS },
        ...filterMatch,
    });
    return {
        totalSchedulePreventiveTicketStatusNews,
        totalSchedulePreventiveTicketStatusInProgress,
        totalSchedulePreventiveTicketStatusUpcomings,
        totalSchedulePreventiveStatusOverdues,
    };
};

const getSchedulePreventiveComments = async (filter, options) => {
    const preventiveFilter = { ...filter };
    if (filter.schedulePreventive && mongoose.Types.ObjectId.isValid(filter.schedulePreventive)) {
        preventiveFilter.schedulePreventive = new mongoose.Types.ObjectId(filter.schedulePreventive);
    }
    const preventives = await SchedulePreventiveCommentModel.paginate(preventiveFilter, {
        ...options,
        populate: [
            {
                path: 'createdBy',
                select: 'username',
            },
        ],
    });
    return preventives;
};
const getTotalMySchedulePreventiveStatus = async (user) => {
    const now = new Date();
    const twoDaysLater = new Date();
    twoDaysLater.setDate(twoDaysLater.getDate() + 2);

    const baseLookup = [
        { $match: { user: Types.ObjectId(user), isCancel: false } },
        {
            $lookup: {
                from: 'schedulepreventives',
                localField: 'schedulePreventive',
                foreignField: '_id',
                as: 'schedulePreventive',
            },
        },
        { $unwind: '$schedulePreventive' },
    ];

    // 1. New = status assigned/accepted + startDate < 2 ngày tới
    const newsAgg = await SchedulePreventiveTaskAssignUserModel.aggregate([
        ...baseLookup,
        {
            $match: {
                status: {
                    $in: [schedulePreventiveTaskAssignUserStatus.assigned, schedulePreventiveTaskAssignUserStatus.accepted],
                },
                'schedulePreventive.startDate': { $lt: twoDaysLater },
            },
        },
        { $count: 'total' },
    ]);
    const totalSchedulePreventiveTaskAssignUserStatusNews = newsAgg[0]?.total || 0;

    // 2. InProgress = status inProgress/partiallyCompleted + startDate < 2 ngày tới
    const inProgressAgg = await SchedulePreventiveTaskAssignUserModel.aggregate([
        ...baseLookup,
        {
            $match: {
                status: {
                    $in: [
                        schedulePreventiveTaskAssignUserStatus.inProgress,
                        schedulePreventiveTaskAssignUserStatus.partiallyCompleted,
                        schedulePreventiveTaskAssignUserStatus.submitted,
                        schedulePreventiveTaskAssignUserStatus.approved,
                        schedulePreventiveTaskAssignUserStatus.pendingApproval,
                    ],
                },
                'schedulePreventive.startDate': { $lt: twoDaysLater },
            },
        },
        { $count: 'total' },
    ]);
    const totalSchedulePreventiveTaskAssignUserStatusInProgress = inProgressAgg[0]?.total || 0;

    // 3. Overdues = status inProgress/partiallyCompleted/assigned/accepted
    //               + (startDate + duration) < hiện tại
    const overdueAgg = await SchedulePreventiveTaskAssignUserModel.aggregate([
        ...baseLookup,
        {
            $match: {
                status: {
                    $in: [
                        schedulePreventiveTaskAssignUserStatus.inProgress,
                        schedulePreventiveTaskAssignUserStatus.partiallyCompleted,
                        schedulePreventiveTaskAssignUserStatus.submitted,
                        schedulePreventiveTaskAssignUserStatus.approved,
                        schedulePreventiveTaskAssignUserStatus.pendingApproval,
                        schedulePreventiveTaskAssignUserStatus.assigned,
                        schedulePreventiveTaskAssignUserStatus.accepted,
                    ],
                },
            },
        },
        {
            $match: {
                $expr: {
                    $lt: [
                        {
                            $add: [
                                '$schedulePreventive.startDate',
                                { $multiply: ['$schedulePreventive.maintenanceDurationHr', 60 * 60 * 1000] },
                                { $multiply: ['$schedulePreventive.maintenanceDurationMin', 60 * 1000] },
                            ],
                        },
                        new Date(),
                    ],
                },
            },
        },
        { $count: 'total' },
    ]);
    const totalSchedulePreventiveTaskAssignUserStatusOverdues = overdueAgg[0]?.total || 0;
    return {
        totalSchedulePreventiveTaskAssignUserStatusNews,
        totalSchedulePreventiveTaskAssignUserStatusInProgress,
        totalSchedulePreventiveTaskAssignUserStatusOverdues,
    };
};
const totalDownTimeSchedulePreventive = async (schedulePreventiveId) => {
    const schedulePreventive = await SchedulePreventiveModel.findById(schedulePreventiveId);
    let totalMs = 0;
    if (!schedulePreventive) {
        // throw new ApiError(httpStatus.NOT_FOUND, 'SchedulePreventive not found');
        return { totalMs };
    }
    const assetMaintenance = await AssetMaintenance.findById(schedulePreventive.assetMaintenance).lean();
    if (!assetMaintenance) {
        return { totalMs };
    }
    const assetMaintenanceIsNotActiveHistory = await AssetMaintenanceIsNotActiveHistoryModel.findOne({
        assetMaintenance: assetMaintenance._id,
        origin: schedulePreventiveId,
    });
    if (!assetMaintenanceIsNotActiveHistory) {
        return { totalMs };
    }
    totalMs = assetMaintenanceIsNotActiveHistory.time;
    return totalMs;
};
const totalTimeConsumedSchedulePrevenTask = async (schedulePreventiveTaskId) => {
    const schedulePreventiveTask = await SchedulePreventiveTaskModel.findById(schedulePreventiveTaskId);
    let totalTimeConsumed = 0;
    if (!schedulePreventiveTask) {
        return (totalTimeConsumed = 0);
    }
    const schedulePreventive = await SchedulePreventiveCheckinCheckOutModel.aggregate([
        {
            $match: {
                schedulePreventiveTask: schedulePreventiveTask._id,
            },
        },
        {
            $group: {
                _id: null,
                totalTimeConsumed: {
                    $sum: {
                        $subtract: [{ $ifNull: ['$checkOutDateTime', new Date()] }, '$checkInDateTime'],
                    },
                },
            },
        },
    ]);

    totalTimeConsumed = schedulePreventive.length > 0 ? schedulePreventive[0]?.totalTimeConsumed : 0;
    return totalTimeConsumed;
};
const totalPlanningHours = async (schedulePreventiveTaskId) => {
    const schedulePreventiveTask = await SchedulePreventiveTaskModel.findById(schedulePreventiveTaskId);
    let totalPlanningHours = 0;
    if (!schedulePreventiveTask) {
        // throw new ApiError(httpStatus.NOT_FOUND, 'schedulePreventiveTaskAssignUser not found');
        return (totalPlanningHours = 0);
    }
    const schedulePreventive = await SchedulePreventiveModel.findById(schedulePreventiveTask.schedulePreventive);
    totalPlanningHours = await totalDownTimeSchedulePreventive(schedulePreventive._id);
    return totalPlanningHours;
};
const getTotalSchedulePreventiveTaskAssignUserByUser = async (userId) => {
    const total = await SchedulePreventiveTaskAssignUserModel.countDocuments({
        user: userId,
        isCancel: false,
        status: {
            $in: [
                schedulePreventiveTaskAssignUserStatus.accepted,
                schedulePreventiveTaskAssignUserStatus.assigned,
                schedulePreventiveTaskAssignUserStatus.inProgress,
                schedulePreventiveTaskAssignUserStatus.partiallyCompleted,
                // bổ sung thêm trạng thái sparePart
                schedulePreventiveTaskAssignUserStatus.submitted,
                schedulePreventiveTaskAssignUserStatus.approved,
                schedulePreventiveTaskAssignUserStatus.pendingApproval,
            ],
        },
    });
    return total;
};
const getUserIdsByDepartment = async (_user) => {
    const user = await User.findById(_user);
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'user not found');
    }
    const users = await User.find({ department: user.department });
    const userIds = users.map((item) => item._id);
    return userIds;
};
const queryGroupSchedulePreventives = async (filter, options, user) => {
    const userIds = await getUserIdsByDepartment(user);
    const assignedSchedules = await SchedulePreventiveTaskAssignUserModel.find({
        user: { $in: userIds },
        isCancel: false,
        status: { $ne: schedulePreventiveTaskAssignUserStatus.replacement },
    }).distinct('schedulePreventive');
    const now = new Date();
    const schedulePreventiveFilter = {};
    if (assignedSchedules.length > 0) {
        schedulePreventiveFilter._id = { $in: assignedSchedules };
    }

    const schedulePeventiveMatch = {};
    if (filter.searchText) {
        const regex = { $regex: filter.searchText, $options: 'i' };

        schedulePeventiveMatch.$or = [
            { code: regex },
            { 'preventive.preventiveName': regex },
            { 'assetMaintenance.serial': regex },
            { 'assetMaintenance.assetModel.assetModelName': regex },
            { 'assetMaintenance.assetModel.asset.assetName': regex },
        ];

        delete filter.searchText;
    }

    if (filter.code) {
        schedulePreventiveFilter.code = { $regex: filter.code, $options: 'i' };
    }
    if (filter.schedulePreventiveStatus) {
        schedulePreventiveFilter.status = filter.schedulePreventiveStatus;
    }
    if (filter.status) {
        schedulePreventiveFilter.status = filter.status;
    }

    if (filter.importance) {
        schedulePreventiveFilter.importance = filter.importance;
        delete filter.importance;
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
        schedulePeventiveMatch.startDate = { ...dateFilter };
    }
    if (filter.assetName) {
        schedulePeventiveMatch['assetMaintenance.assetModel.asset.assetName'] = { $regex: filter.assetName, $options: 'i' };
    }
    if (filter.preventiveName) {
        schedulePeventiveMatch['preventive.preventiveName'] = { $regex: filter.preventiveName, $options: 'i' };
    }
    if (filter.serial) {
        schedulePeventiveMatch['assetMaintenance.serial'] = { $regex: filter.serial, $options: 'i' };
    }
    if (filter.assetStyle) {
        schedulePeventiveMatch['assetMaintenance.assetStyle'] = filter.assetStyle;
    }
    if (filter.assetModelName) {
        schedulePeventiveMatch['assetMaintenance.assetModel.assetModelName'] = {
            $regex: filter.assetModelName,
            $options: 'i',
        };
    }
    if (filter.branchs) {
        const _branchs = filter.branchs.map((_b) => mongoose.Types.ObjectId(_b));
        schedulePeventiveMatch['assetMaintenance.branch'] = {
            $in: _branchs,
        };
    }
    if (filter.ticketStatus) {
        switch (filter.ticketStatus) {
            case ticketSchedulePreventiveStatus.upcoming:
                schedulePreventiveFilter.startDate = {
                    ...(schedulePreventiveFilter.startDate || {}),
                    $gt: new Date(),
                };
                schedulePreventiveFilter.ticketStatus = ticketSchedulePreventiveStatus.new;
                break;
            case ticketSchedulePreventiveStatus.new:
                now.setDate(now.getDate() + 2); // Cộng thêm 2 ngày
                schedulePreventiveFilter.startDate = { $lt: now };
                schedulePreventiveFilter.ticketStatus = ticketSchedulePreventiveStatus.new;
                break;
            case ticketSchedulePreventiveStatus.inProgress:
                // now.setDate(now.getDate() + 2); // Cộng thêm 1 ngày
                // schedulePreventiveFilter.startDate = { $lt: now };
                schedulePreventiveFilter.ticketStatus = ticketSchedulePreventiveStatus.inProgress;
                break;
            case ticketSchedulePreventiveStatus.overdue:
                schedulePreventiveFilter.$expr = {
                    $lt: [
                        {
                            $add: [
                                '$startDate',
                                { $multiply: ['$maintenanceDurationHr', 60 * 60 * 1000] },
                                { $multiply: ['$maintenanceDurationMin', 60 * 1000] },
                            ],
                        },
                        new Date(),
                    ],
                };
                schedulePreventiveFilter.ticketStatus = {
                    $in: [ticketSchedulePreventiveStatus.inProgress, ticketSchedulePreventiveStatus.new],
                };
                break;
            default:
                schedulePreventiveFilter.ticketStatus = ticketSchedulePreventiveStatus.history;
                break;
        }
    }
    const searchAggregaates = [
        {
            $match: schedulePreventiveFilter,
        },
        {
            $lookup: {
                from: 'assetmaintenances',
                localField: 'assetMaintenance',
                foreignField: '_id',
                as: 'assetMaintenance',
                pipeline: [
                    {
                        $lookup: {
                            from: 'assetmodels',
                            localField: 'assetModel',
                            foreignField: '_id',
                            as: 'assetModel',
                            pipeline: [
                                {
                                    $lookup: {
                                        from: 'assets',
                                        localField: 'asset',
                                        foreignField: '_id',
                                        as: 'asset',
                                    },
                                },
                                {
                                    $lookup: {
                                        from: 'categorys',
                                        localField: 'category',
                                        foreignField: '_id',
                                        as: 'category',
                                    },
                                },
                                {
                                    $lookup: {
                                        from: 'manufacturers',
                                        localField: 'manufacturer',
                                        foreignField: '_id',
                                        as: 'manufacturer',
                                    },
                                },

                                { $unwind: { path: '$asset', preserveNullAndEmptyArrays: true } },
                                { $unwind: { path: '$manufacturer', preserveNullAndEmptyArrays: true } },
                                { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
                            ],
                        },
                    },
                    {
                        $lookup: {
                            from: 'customers',
                            localField: 'customer',
                            foreignField: '_id',
                            as: 'customer',
                        },
                    },
                    {
                        $lookup: {
                            from: 'branches',
                            localField: 'branch',
                            foreignField: '_id',
                            as: 'objectBranch',
                        },
                    },
                    {
                        $lookup: {
                            from: 'departments',
                            localField: 'department',
                            foreignField: '_id',
                            as: 'objectDepartments',
                        },
                    },
                    { $unwind: { path: '$objectBranch', preserveNullAndEmptyArrays: true } },
                    { $unwind: { path: '$objectDepartments', preserveNullAndEmptyArrays: true } },
                    { $unwind: { path: '$assetModel', preserveNullAndEmptyArrays: true } },
                    { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } },
                ],
            },
        },
        {
            $lookup: {
                from: 'amcs',
                localField: 'amc',
                foreignField: '_id',
                as: 'amc',
            },
        },
        {
            $lookup: {
                from: 'services',
                localField: 'service',
                foreignField: '_id',
                as: 'service',
            },
        },
        {
            $lookup: {
                from: 'users',
                localField: 'createdBy',
                foreignField: '_id',
                as: 'createdBy',
            },
        },
        {
            $lookup: {
                from: 'preventives',
                localField: 'preventive',
                foreignField: '_id',
                as: 'preventive',
            },
        },
        { $unwind: { path: '$preventive', preserveNullAndEmptyArrays: true } },
        { $unwind: { path: '$createdBy', preserveNullAndEmptyArrays: true } },
        { $unwind: { path: '$amc', preserveNullAndEmptyArrays: true } },
        { $unwind: { path: '$assetMaintenance', preserveNullAndEmptyArrays: true } },
        { $match: schedulePeventiveMatch },
    ];

    if (options.sortBy && options.sortOrder) {
        searchAggregaates.push({
            $sort: { [options.sortBy]: Number(options.sortOrder) },
        });
    }
    const pagzingAggregaates = [
        {
            $skip: (Number(options.page) - 1) * Number(options.limit),
        },
        {
            $limit: Number(options.limit),
        },
    ];
    const _schedulePreventives = await SchedulePreventiveModel.aggregate([...searchAggregaates, ...pagzingAggregaates]);
    const countAggregaates = [
        {
            $count: 'totalResults',
        },
    ];
    const totalResults = await SchedulePreventiveModel.aggregate([...searchAggregaates, ...countAggregaates]);
    return {
        _schedulePreventives,
        totalResults: totalResults[0],
        assignedSchedules,
    };
};
const updateSchedulePreventiveTaskAndAssignUserAboutIsCancel = async (preventive) => {
    // xóa đi những bản ghi SchedulePreventiveTaskModel và SchedulePreventiveTaskAssignUserModel trc đã
    const scheduleUpcomings = await SchedulePreventiveModel.find({
        preventive,
        status: schedulePreventiveStatus.new,
        startDate: { $gt: new Date() },
    }).select('_id');
    const scheduleUpcomingIds = scheduleUpcomings.map((item) => item._id);
    // trường hợp nếu mà thay đổi hợp đồng lần thứ 2 (khi công việc này đc làm sớm) mà các công việc đã hoàn thành cũng sẽ bị xóa
    const taskIdUpcomingHaveCompletedAndPartiallyCompleted = await SchedulePreventiveTaskAssignUserModel.find({
        schedulePreventive: { $in: scheduleUpcomingIds },
        status: {
            $in: [
                schedulePreventiveTaskAssignUserStatus.completed,
                schedulePreventiveTaskAssignUserStatus.partiallyCompleted,
            ],
        },
    }).distinct('schedulePreventiveTask');
    await SchedulePreventiveTaskModel.deleteMany({
        schedulePreventive: { $in: scheduleUpcomingIds },
        _id: { $nin: taskIdUpcomingHaveCompletedAndPartiallyCompleted },
    });
    await SchedulePreventiveTaskAssignUserModel.deleteMany({
        schedulePreventive: { $in: scheduleUpcomingIds },
        status: {
            $nin: [
                schedulePreventiveTaskAssignUserStatus.completed,
                schedulePreventiveTaskAssignUserStatus.partiallyCompleted,
            ],
        },
    });

    // dưới này cập nhật
    const schedules = await SchedulePreventiveModel.find({
        preventive,
        ticketStatus: { $in: [ticketSchedulePreventiveStatus.new, ticketSchedulePreventiveStatus.inProgress] },
    }).select('_id');
    const scheduleIds = schedules.map((s) => s._id);
    // update các task công việc cũ VỀ isCancel == true . là không lấy nữa
    const taskIdsHaveCompletedAndPartiallyCompleted = await SchedulePreventiveTaskAssignUserModel.find({
        schedulePreventive: { $in: scheduleIds },
        status: {
            $in: [
                schedulePreventiveTaskAssignUserStatus.completed,
                schedulePreventiveTaskAssignUserStatus.partiallyCompleted,
            ],
        },
        isCancel: false,
    }).distinct('schedulePreventiveTask');
    await SchedulePreventiveTaskModel.updateMany(
        {
            schedulePreventive: { $in: scheduleIds },
            isCancel: false,
            _id: { $nin: taskIdsHaveCompletedAndPartiallyCompleted },
        },
        { isCancel: true }
    );
    await SchedulePreventiveTaskAssignUserModel.updateMany(
        {
            schedulePreventive: { $in: scheduleIds },
            isCancel: false,
            status: {
                $nin: [
                    schedulePreventiveTaskAssignUserStatus.completed,
                    schedulePreventiveTaskAssignUserStatus.partiallyCompleted,
                ],
            },
        },
        { isCancel: true }
    );
    // đăng xuất khi còn đang làm việc
    const schedulePreventiveTasks = await SchedulePreventiveTaskModel.find({
        schedulePreventive: { $in: scheduleIds },
    }).select('_id');
    const schedulePreventiveTaskIds = schedulePreventiveTasks.map((t) => t._id);
    await SchedulePreventiveCheckinCheckOutModel.updateMany(
        { checkOutDateTime: null, schedulePreventiveTask: { $in: schedulePreventiveTaskIds } },
        { checkOutDateTime: Date.now() }
    );
    // tạo mới các công việc được giao
    const tasks = await PreventiveTaskModel.find({ preventive }).lean();
    const taskIds = tasks.map((t) => t._id);
    const taskItems = await PreventiveTaskItemModel.find({ preventiveTask: { $in: taskIds } }).lean();
    for (const scheduleId of scheduleIds) {
        // đưa về new
        await SchedulePreventiveModel.findByIdAndUpdate(scheduleId, {
            status: schedulePreventiveStatus.new,
            ticketStatus: ticketSchedulePreventiveStatus.new,
        });
        const taskIdMap = {};
        for (const task of tasks) {
            const newTask = await SchedulePreventiveTaskModel.create({
                ...task,
                schedulePreventive: scheduleId,
                _id: undefined,
                preventive: preventive,
                createdAt: undefined,
                updatedAt: undefined,
                preventiveTask: task._id,
            });
            taskIdMap[task._id] = newTask._id;
        }
        // Copy Task Items
        for (const item of taskItems) {
            await SchedulePreventiveTaskItemModel.create({
                ...item,
                schedulePreventiveTask: taskIdMap[item.preventiveTask],
                _id: undefined,
                preventiveTask: undefined,
                preventive: preventive,
                createdAt: undefined,
                updatedAt: undefined,
            });
        }
    }
};
const getAssetSchedulePreventivetHistorys = async (filter, options) => {
    const payloadFilter = {};
    if (filter.assetMaintenance) {
        payloadFilter.assetMaintenance = mongoose.Types.ObjectId(filter.assetMaintenance);
    }
    if (filter.code) {
        payloadFilter.code = filter.code;
    }
    if (filter.preventiveName) {
        const preventives = await PreventiveModel.find({
            preventiveName: { $regex: filter.preventiveName, $options: 'i' },
        }).select('_id');
        payloadFilter.preventive = preventives.map((p) => p._id);
    }

    if (filter.importance) {
        payloadFilter.importance = filter.importance;
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
        payloadFilter.startDate = { ...dateFilter };
    }
    const schedulePreventives = await SchedulePreventiveModel.paginate(payloadFilter, {
        ...options,
        populate: [
            { path: 'preventive' },
            {
                path: 'assetMaintenance',
                populate: [{ path: 'customer' }],
            },
        ],
    });
    return schedulePreventives;
};
const getDowntimeByShedulePreventiveAssignUser = async (schedulePreventiveTask, user) => {
    const data = await SchedulePreventiveCheckinCheckOutModel.findOne({
        schedulePreventiveTask: schedulePreventiveTask,
        user: user,
    }).sort({ createdAt: 1 });
    let totalMinutes = 0;
    if (data && data.checkInDateTime) {
        const diffMs = new Date() - data.checkInDateTime;
        const minutes = Math.floor(diffMs / (1000 * 60));
        totalMinutes += minutes;
    }
    const downtimeHr = Math.floor(totalMinutes / 60);
    const downtimeMin = totalMinutes % 60;

    return { downtimeHr, downtimeMin };
};
const schedulePreventiveTaskById = async (id) => {
    const _schedulePreventiveTask = await SchedulePreventiveTaskModel.findById(id);
    return _schedulePreventiveTask;
};
const getByTask = async (id) => {
    const _schedulePreventiveTask = await SchedulePreventiveTaskModel.findById(id);
    const schedulePreventive = await SchedulePreventive.findById(_schedulePreventiveTask.schedulePreventive);
    return schedulePreventive;
};
module.exports = {
    getTotalSchedulePreventiveStatus,
    querySchedulePreventives,
    getSchedulePreventiveById,
    updateSchedulePreventiveById,
    deleteSchedulePreventiveById,
    createSchedulePreventive,
    deleteManySchedulePreventive,
    confirmSchedulePreventiveUser,
    cancelConfirmSchedulePreventiveUser,
    checkInOutListAndTasks,
    getSchedulePreventiveTaskByRes,
    getSchedulePreventiveTaskItemByRes,
    getSchedulePreventiveTaskAssignUserByRes,
    getSchedulePreventiveSparePartByRes,
    schedulePreventiveTaskAssignUser,
    getSchedulePreventiveTaskAssignUserByStatus,
    createSchedulePreventiveComment,
    queryMySchedulePreventives,
    getSchedulePreventiveTaskAssignUserById,
    getSchedulePreventiveTaskItemByResAndPopulate,
    comfirmCancelSchedulePreventive,
    switchToWaitingForAdminApproval,
    comfirmCloseSchedulePreventive,
    comfirmReOpenSchedulePreventive,
    createSchedulePreventiveHistory,
    getLatestSchedulePreventiveHistory,
    getCurrentCheckinCheckout,
    checkinSchedulePreventiveTask,
    checkOutSchedulePreventiveTask,
    getLastShedulePreventCheckInCheckOutByTaskId,
    getSchedulePreventiveHistorys,
    startWorkschedulePreventiveTask,
    checkSkipSchedulePreventive,
    getTotalMySchedulePreventiveStatus,
    totalDownTimeSchedulePreventive,
    getSchedulePreventiveComments,
    totalTimeConsumedSchedulePrevenTask,
    totalPlanningHours,
    getTotalSchedulePreventiveTaskAssignUserByUser,
    queryGroupSchedulePreventives,
    getUserIdsByDepartment,
    getCountSchedulePrevetiveTaskAssignUserByTask,
    updateSchedulePreventiveTaskAndAssignUserAboutIsCancel,
    getAssetSchedulePreventivetHistorys,
    getDowntimeByShedulePreventiveAssignUser,
    getSchedulePreventiveByIdNotPopulate,
    schedulePreventiveTaskById,
    getByTask,
    checkAssetMaintenanceIsNotActiveHistoryCloseWithSchedulePreventive,
};
