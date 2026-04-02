const httpStatus = require('http-status');
const mongoose = require('mongoose');
const {
    PreventiveModel,
    PreventiveTaskModel,
    PreventiveTaskItemModel,
    PreventiveSparePartModel,
    PreventiveTaskAssignUserModel,
    PreventiveCommentModel,
    SchedulePreventiveModel,
    SchedulePreventiveTaskAssignUserModel,
    SchedulePreventiveTaskModel,
    SchedulePreventiveTaskItemModel,
    SchedulePreventiveSparePartModel,
    AssetMaintenance,
    PreventiveMonitoringModel,
    PreventiveConditionBasedModel,
    SchedulePreventiveCommentModel,
    PreventiveConditionBasedHistoryModel,
    PreventiveConditionBasedHistoryDetailModel,
    PreventiveOfModelConditionBasedModel,
    Department,
} = require('../../models');
const ApiError = require('../../utils/ApiError');
const schedulePreventiveService = require('./schedulePreventive.service');
const preventiveMonitoringService = require('./preventiveMonitoring.service');
const {
    schedulePreventiveUserType,
    statusType,
    schedulePreventiveWorkingStatus,
    ticketPreventiveStatus,
    preventiveStatus,
    scheduleType,
    scheduleFrequencyType,
    historySchedulePreventiveStatus,
    calendarType,
    preventiveFrequencyType,
    scheduleBasedOnType,
} = require('../../utils/constant');
const { sequenceService } = require('..');
const assetMaintenanceService = require('../common/assetMaintenance.service');
const weekday = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const calculaterFirstScheduleDate = (preventive, actualScheduleDate) => {
    const {
        frequencyType,
        frequencyValue,
        scheduleRepeatHours,
        scheduleRepeatDays,
        calendarType,
        scheduleDate,
        calendarEndBy,
        calendarEndAfter,
    } = preventive;
    const _actualScheduleDate = new Date(actualScheduleDate);
    const now = new Date();
    const dayOfWeekOfActualScheduleDate = weekday[_actualScheduleDate.getDay()];
    const hourOfDayOfActualScheduleDate = _actualScheduleDate.getHours();

    // if (preventive.scheduleType === scheduleType.calendar) {
    switch (frequencyType) {
        case scheduleFrequencyType.hours:
            // kiểm tra thứ của ngày hiện tại
            if (scheduleRepeatDays.find((s) => s === dayOfWeekOfActualScheduleDate)) {
                return _actualScheduleDate;
            }
            return calculaterFirstScheduleDate(
                preventive,
                _actualScheduleDate.setHours(_actualScheduleDate.getHours() + preventive.calenderFrequencyDuration)
            );
        case scheduleFrequencyType.repeatHours:
            if (
                scheduleRepeatDays.find((s) => s === dayOfWeekOfActualScheduleDate) &&
                scheduleRepeatHours.includes(hourOfDayOfActualScheduleDate)
            ) {
                return _actualScheduleDate;
            }
            _actualScheduleDate.setHours(_actualScheduleDate.getHours() + 1);
            return calculaterFirstScheduleDate(preventive, _actualScheduleDate);

        case scheduleFrequencyType.days:
            return _actualScheduleDate;
        case scheduleFrequencyType.date: // gen ra đúng 1 bản vào chính ngày _scheduleDate
            return _actualScheduleDate;

        case scheduleFrequencyType.repeaetWeekDays:
            if (scheduleRepeatDays.find((s) => s === dayOfWeekOfActualScheduleDate)) {
                return _actualScheduleDate;
            }
            return calculaterFirstScheduleDate(preventive, _actualScheduleDate.setDate(_actualScheduleDate.getDate() + 1));
        case scheduleFrequencyType.weeks:
            // đều genm ra ngày đầy tiên, bản ghi tiếp thoe sẽ là ngày bắt đầu đó + với các ngày or các tháng, các năm
            return _actualScheduleDate;
        case scheduleFrequencyType.months:
            // đều genm ra ngày đầy tiên, bản ghi tiếp thoe sẽ là ngày bắt đầu đó + với các ngày or các tháng, các năm
            return _actualScheduleDate;
        case scheduleFrequencyType.years:
            // đều genm ra ngày đầy tiên, bản ghi tiếp thoe sẽ là ngày bắt đầu đó + với các ngày or các tháng, các năm
            return _actualScheduleDate;
        default:
            return null;
    }
    // } else if (preventive.scheduleType === scheduleType.monitoring) {
    // } else if (preventive.scheduleType === scheduleType.calendarOrMonitoring) {
    // } else if (preventive.scheduleType === scheduleType.conditionBasedSchedule) {
    // } else {
    //     // adhoc
    // }
};
const createPreventive = async (data) => {
    if (!data.preventiveTasks || data.preventiveTasks.length === 0) {
        throw new ApiError(httpStatus.NOT_FOUND, 'preventiveTasks not found');
    }
    await assetMaintenanceService.checkAssetStyleNotAccessories(data.preventive.assetMaintenance);
    await assetMaintenanceService.checkAssetMaintenanceNotWithAssetStatus(data?.assetMaintenance);
    const preventive = await PreventiveModel.create(data.preventive);
    // Thêm lại các Task và TaskItem mới
    if (data.preventiveTasks && data.preventiveTasks.length > 0) {
        // eslint-disable-next-line no-plusplus
        for (let i = 0; i < data.preventiveTasks.length; i++) {
            const task = data.preventiveTasks[i];
            delete task._id; // Xóa _id nếu có
            task.preventive = preventive._id;
            // eslint-disable-next-line no-await-in-loop
            const newTask = await PreventiveTaskModel.create(task);
            if (task.taskItems && task.taskItems.length > 0) {
                // eslint-disable-next-line no-plusplus
                for (let j = 0; j < task.taskItems.length; j++) {
                    const item = task.taskItems[j];
                    item.preventiveTask = newTask._id;
                    item.preventive = preventive._id;
                    // eslint-disable-next-line no-await-in-loop
                    await PreventiveTaskItemModel.create(item);
                }
            }
        }
    }
    // Thêm lại SpareParts mới
    if (data.preventiveSpareParts && data.preventiveSpareParts.length > 0) {
        // eslint-disable-next-line no-plusplus
        for (let i = 0; i < data.preventiveSpareParts.length; i++) {
            const part = data.preventiveSpareParts[i];
            part.preventive = preventive._id;
            // eslint-disable-next-line no-await-in-loop
            await PreventiveSparePartModel.create(part);
        }
    }
    if (data.preventiveConditionBaseds && data.preventiveConditionBaseds.length > 0) {
        // eslint-disable-next-line no-plusplus
        for (let i = 0; i < data.preventiveConditionBaseds.length; i++) {
            const part = data.preventiveConditionBaseds[i];
            part.preventive = preventive._id;
            // eslint-disable-next-line no-await-in-loop
            await PreventiveConditionBasedModel.create(part);
        }
    }
    return preventive;
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
const queryPreventives = async (filter, options, req) => {
    const preventiveFilter = filter;
    // chỉ lấy các activity là true
    preventiveFilter.activity = true;
    const peventiveMatch = {};
    // kiểm tra xem có được xem tất cả tài sản không
    let allowViewAll = true;
    if (req?.companySetting?.filterByAccount) {
        const dep = await Department.findById(req.user.department).select('allowViewAll');
        allowViewAll = dep?.allowViewAll;
    }
    if (!allowViewAll) {
        peventiveMatch['assetMaintenance.department'] = mongoose.Types.ObjectId(req?.user?.department);
    }
    if (filter?.searchText) {
        const regex = { $regex: filter.searchText, $options: 'i' };
        peventiveMatch.$or = [
            { code: regex },
            { preventiveName: regex },
            { 'assetMaintenance.serial': regex },
            { 'assetMaintenance.assetModel.asset.assetName': regex },
            { 'assetMaintenance.assetModel.assetModelName': regex },
        ];
        delete preventiveFilter.searchText;
    }

    if (filter.code) {
        preventiveFilter.code = { $regex: filter.code, $options: 'i' };
    }
    if (filter.preventiveName) {
        preventiveFilter.preventiveName = { $regex: filter.preventiveName, $options: 'i' };
    }
    if (filter.status) {
        preventiveFilter.status = filter.status;
    }
    if (filter.importance) {
        preventiveFilter.importance = filter.importance;
    }
    if (filter.preventiveOfModel) {
        preventiveFilter.preventiveOfModel = mongoose.Types.ObjectId(filter.preventiveOfModel);
    }
    if (filter.isOtherPreventiveOfModel === true) {
        preventiveFilter.$or = [{ preventiveOfModel: { $exists: false } }, { preventiveOfModel: null }];
        delete filter.isOtherPreventiveOfModel;
    }
    if (filter.serial) {
        peventiveMatch['assetMaintenance.serial'] = {
            $regex: filter.serial,
            $options: 'i', // không phân biệt hoa thường
        };
        delete filter.serial;
    }
    if (filter.branchs) {
        const _branchs = filter.branchs.map((_b) => mongoose.Types.ObjectId(_b));
        peventiveMatch['assetMaintenance.branch'] = {
            $in: _branchs,
        };
        delete filter.branchs;
    }
    delete filter.branchs;
    if (filter.assetStyle) {
        peventiveMatch['assetMaintenance.assetStyle'] = filter.assetStyle;
        delete filter.assetStyle;
    }
    if (filter.assetModelName) {
        peventiveMatch['assetMaintenance.assetModel.assetModelName'] = {
            $regex: filter.assetModelName,
            $options: 'i', // không phân biệt hoa thường
        };
        delete filter.assetModelName;
    }
    if (filter.assetName) {
        peventiveMatch['assetMaintenance.assetModel.asset.assetName'] = {
            $regex: filter.assetName,
            $options: 'i', // không phân biệt hoa thường
        };
        delete filter.assetName;
    }
    if (filter.assetModel) {
        peventiveMatch['assetMaintenance.assetModel._id'] = mongoose.Types.ObjectId(filter.assetModel);
        delete filter.assetModel;
    }
    const searchAggregaates = [
        {
            $match: preventiveFilter,
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
        // {
        //     $lookup: {
        //         from: 'assetmaintenancemonitoringpoints',
        //         localField: 'assetMaintenanceMonitoringPoint',
        //         foreignField: '_id',
        //         as: 'assetMaintenanceMonitoringPoint',
        //     }
        // },
        // { $unwind: { path: '$assetMaintenanceMonitoringPoint', preserveNullAndEmptyArrays: true } },
        { $unwind: { path: '$assetMaintenance', preserveNullAndEmptyArrays: true } },
        { $match: peventiveMatch },
    ];
    if (options.sortBy && options.sortOrder) {
        searchAggregaates.push({
            $sort: { [options.sortBy]: Number(options.sortOrder) },
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
    const preventives = await PreventiveModel.aggregate([...searchAggregaates, ...pagzingAggregaates]);
    const countAggregaates = [
        {
            $count: 'totalResults',
        },
    ];
    const totalResults = await PreventiveModel.aggregate([...searchAggregaates, ...countAggregaates]);
    return {
        preventives,
        totalResults: totalResults[0],
    };
    // const breakdowns = await PreventiveModel.paginate(preventiveFilter, {
    //     ...options,
    //     populate: [
    //         {
    //             path: 'assetMaintenance',
    //             populate: [
    //                 {
    //                     path: 'assetModel', populate: [
    //                         {
    //                             path: 'asset',
    //                         },
    //                         { path: 'category', select: 'categoryName' },
    //                         { path: 'manufacturer', select: 'manufacturerName' },

    //                     ]
    //                 },
    //                 { path: 'customer', select: 'customerName' },
    //             ],
    //         },
    //     ],
    // });
    // return breakdowns;
};
/**
 * Get user by id
 * @param {ObjectId} id
 * @returns {Promise<User>}
 */
const getPreventiveById = async (id) => {
    return PreventiveModel.findById(id).populate([
        {
            path: 'assetMaintenance',
            populate: [
                {
                    path: 'assetModel',
                    populate: [
                        {
                            path: 'asset',
                        },
                        { path: 'category' },
                        { path: 'manufacturer' },
                    ],
                },
                { path: 'customer', select: 'customerName' },
            ],
        },
        {
            path: 'customer',
        },
    ]);
};

const updatePreventiveById = async (id, data) => {
    const preventive = await PreventiveModel.findById(id);
    if (!preventive) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Preventive not found');
    }
    // check luôn phải có công việc
    if (!data.preventiveTasks || data.preventiveTasks.length === 0) {
        throw new ApiError(httpStatus.NOT_FOUND, 'preventiveTasks not found');
    }
    await assetMaintenanceService.checkAssetStyleNotAccessories(data.preventive.assetMaintenance);
    await assetMaintenanceService.checkAssetMaintenanceNotWithAssetStatus(data?.assetMaintenance);
    // Cập nhật thông tin chính của Preventive
    Object.assign(preventive, data.preventive);
    await preventive.save();

    // Xóa các dữ liệu liên quan cũ
    const tasks = await PreventiveTaskModel.find({ preventive: id }).select('_id');
    const taskIds = tasks.map((task) => task._id);
    await PreventiveTaskItemModel.deleteMany({ preventiveTask: { $in: taskIds } });
    await PreventiveTaskAssignUserModel.deleteMany({ preventiveTask: { $in: taskIds } });
    await PreventiveTaskModel.deleteMany({ preventive: id });
    await PreventiveSparePartModel.deleteMany({ preventive: id });
    await PreventiveConditionBasedModel.deleteMany({ preventive: id });
    // Thêm lại các Task và TaskItem mới
    if (data.preventiveTasks && data.preventiveTasks.length > 0) {
        // eslint-disable-next-line no-plusplus
        for (let i = 0; i < data.preventiveTasks.length; i++) {
            const task = data.preventiveTasks[i];
            delete task._id; // Xóa _id nếu có
            task.preventive = preventive._id;
            // eslint-disable-next-line no-await-in-loop
            const newTask = await PreventiveTaskModel.create(task);

            if (task.taskItems && task.taskItems.length > 0) {
                // eslint-disable-next-line no-plusplus
                for (let j = 0; j < task.taskItems.length; j++) {
                    const item = task.taskItems[j];
                    item.preventiveTask = newTask._id;
                    item.preventive = preventive._id;
                    // eslint-disable-next-line no-await-in-loop
                    await PreventiveTaskItemModel.create(item);
                }
            }
        }
    }
    // Thêm lại SpareParts mới
    if (data.preventiveSpareParts && data.preventiveSpareParts.length > 0) {
        // eslint-disable-next-line no-plusplus
        for (let i = 0; i < data.preventiveSpareParts.length; i++) {
            const part = data.preventiveSpareParts[i];
            part.preventive = preventive._id;
            // eslint-disable-next-line no-await-in-loop
            await PreventiveSparePartModel.create(part);
        }
    }
    if (data.preventiveConditionBaseds && data.preventiveConditionBaseds.length > 0) {
        // eslint-disable-next-line no-plusplus3
        for (let i = 0; i < data.preventiveConditionBaseds.length; i++) {
            const part = data.preventiveConditionBaseds[i];
            part.preventive = preventive._id;
            // eslint-disable-next-line no-await-in-loop
            await PreventiveConditionBasedModel.create(part);
        }
    }
    return preventive;
};

const updateStatus = async (id, updateBody) => {
    const preventive = await PreventiveModel.findById(id);
    if (!preventive) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Preventive not found');
    }
    Object.assign(preventive, updateBody.preventive || updateBody);
    await preventive.save();
    // update các giám sất về false
    await PreventiveMonitoringModel.updateMany({ preventive: preventive._id, activity: true }, { activity: false });
    return preventive;
};
const startPreventive = async (id, _actualScheduleDate, initialValue, supervisor, frequency, cycle) => {
    const preventive = await PreventiveModel.findById(id);
    if (!preventive) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Preventive not found');
    }
    Object.assign(preventive, {
        actualScheduleDate: _actualScheduleDate,
        status: preventiveStatus.started,
        isStart: true,
        initialValue,
        supervisor,
        frequency,
        cycle,
    });

    await preventive.save();
    return preventive;
};

const copyRelatedData = async (preventive, schedulePreventive, _user) => {
    const assignUsers = await PreventiveTaskAssignUserModel.find({ preventive: preventive._id }).lean();
    const tasks = await PreventiveTaskModel.find({ preventive: preventive._id }).lean();
    const taskIds = tasks.map((t) => t._id);
    const taskItems = await PreventiveTaskItemModel.find({ preventiveTask: { $in: taskIds } }).lean();
    // const comments = await PreventiveCommentModel.find({ preventive: preventive._id }).lean();
    const spareParts = await PreventiveSparePartModel.find({ preventive: preventive._id }).lean();

    // Copy Spare Parts

    for (const part of spareParts) {
        await SchedulePreventiveSparePartModel.create({
            ...part,
            schedulePreventive: schedulePreventive.id,
            _id: undefined,
            preventive: preventive._id,
            createdAt: undefined,
            updatedAt: undefined,
        });
    }

    // Copy Tasks
    const taskIdMap = {};
    for (const task of tasks) {
        const newTask = await SchedulePreventiveTaskModel.create({
            ...task,
            schedulePreventive: schedulePreventive.id,
            _id: undefined,
            preventive: preventive._id,
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
            preventive: preventive._id,
            createdAt: undefined,
            updatedAt: undefined,
        });
    }

    // Copy Assign Users
    for (const user of assignUsers) {
        const count = await schedulePreventiveService.getCountSchedulePrevetiveTaskAssignUserByTask(
            taskIdMap[user.preventiveTask]
        );
        if (count > 1) {
            throw new ApiError('Một công việc chỉ được phép giao cho 1 kỹ sư thực hiện');
        }
        await SchedulePreventiveTaskAssignUserModel.create({
            ...user,
            schedulePreventiveTask: taskIdMap[user.preventiveTask],
            schedulePreventive: schedulePreventive._id,
            _id: undefined,
            preventive: preventive._id,
            createdAt: undefined,
            updatedAt: undefined,
        });

        const latestHistory = await schedulePreventiveService.getLatestSchedulePreventiveHistory();

        await schedulePreventiveService.createSchedulePreventiveHistory({
            schedulePreventive: schedulePreventive._id,
            schedulePreventiveTask: taskIdMap[user.preventiveTask],
            status: historySchedulePreventiveStatus.assigned,
            createdBy: _user,
            assignedTo: user.user,
            oldStatus: latestHistory.status,
            createdAt: undefined,
            updatedAt: undefined,
        });
    }
    // // Copy Comments
    // for (const comment of comments) {
    //     await SchedulePreventiveCommentModel.create({
    //         ...comment,
    //         schedulePreventive: schedulePreventive.id,
    //         _id: undefined,
    //         preventive: preventive._id,
    //         updatedAt: undefined,
    //     });
    // }
};

// Helper: cộng "bước" theo frequencyType
const getNextBaseDate = (preventive, fromDate) => {
    const d = new Date(fromDate);

    switch (preventive.frequencyType) {
        case scheduleFrequencyType.hours:
            d.setHours(d.getHours() + (preventive.calenderFrequencyDuration || 1));
            return d;

        case scheduleFrequencyType.repeatHours:
            // lặp theo danh sách giờ -> tiến 1 giờ, rồi calculaterFirstScheduleDate sẽ canh lại
            d.setHours(d.getHours() + 1);
            return d;

        case scheduleFrequencyType.days:
            d.setDate(d.getDate() + (preventive.calenderFrequencyDuration || 1));
            return d;

        case scheduleFrequencyType.repeaetWeekDays:
            // đi từng ngày, hàm calculaterFirstScheduleDate sẽ lọc theo thứ
            d.setDate(d.getDate() + 1);
            return d;

        case scheduleFrequencyType.weeks:
            d.setDate(d.getDate() + 7 * (preventive.frequencyValue || 1));
            return d;

        case scheduleFrequencyType.months:
            d.setMonth(d.getMonth() + (preventive.frequencyValue || 1));
            return d;

        case scheduleFrequencyType.years:
            d.setFullYear(d.getFullYear() + (preventive.frequencyValue || 1));
            return d;

        case scheduleFrequencyType.date:
            // 1 lần duy nhất – cứ đẩy xa để vòng lặp dừng
            d.setFullYear(d.getFullYear() + 100);
            return d;

        default:
            // fallback: tiến 1 ngày
            d.setDate(d.getDate() + 1);
            return d;
    }
};
const copyDataSchedulePreventiveByPreventive = async (preventive, _user, startDate, preventiveMonitoringHistoryId) => {
    const assetMaintenance = await AssetMaintenance.findById(preventive.assetMaintenance);
    const payload = {
        ...preventive,
        code: await sequenceService.generateSequenceCode('SCHEDULE_PREVENTIVE'),
        _id: undefined,
        preventive: preventive._id,
        status: undefined,
        startDate,
        customer: assetMaintenance.customer,
        createdAt: undefined,
        updatedAt: undefined,
        assetMaintenance: assetMaintenance._id,
        preventiveMonitoringHistory: preventiveMonitoringHistoryId,
        province: assetMaintenance?.province,
        commune: assetMaintenance?.commune,
        branch: assetMaintenance?.branch,
        building: assetMaintenance?.building,
        floor: assetMaintenance?.floor,
        department: assetMaintenance?.department,
        addressNote: assetMaintenance?.addressNote,
    };
    const schedulePreventive = await SchedulePreventiveModel.create(payload);
    await schedulePreventiveService.createSchedulePreventiveHistory({
        schedulePreventive: schedulePreventive._id,
        status: historySchedulePreventiveStatus.new,
        createdBy: _user,
    });
    await copyRelatedData(preventive, schedulePreventive, _user);
    return schedulePreventive;
};
const generateSchedulePrenventiveWithCalendar = async (preventive, assetMaintenance, _user) => {
    if (preventive.frequencyType === preventiveFrequencyType.date) {
        const startDate = calculaterFirstScheduleDate(preventive, preventive.actualScheduleDate);
        const payload = {
            ...preventive,
            code: await sequenceService.generateSequenceCode('SCHEDULE_PREVENTIVE'),
            _id: undefined,
            preventive: preventive._id,
            status: undefined,
            startDate,
            customer: assetMaintenance.customer,
            createdAt: undefined,
            updatedAt: undefined,
            province: assetMaintenance?.province,
            commune: assetMaintenance?.commune,
            branch: assetMaintenance?.branch,
            building: assetMaintenance?.building,
            floor: assetMaintenance?.floor,
            department: assetMaintenance?.department,
            addressNote: assetMaintenance?.addressNote,
        };
        const schedulePreventive = await SchedulePreventiveModel.create(payload);
        await schedulePreventiveService.createSchedulePreventiveHistory({
            schedulePreventive: schedulePreventive._id,
            status: historySchedulePreventiveStatus.new,
            createdBy: _user,
        });
        await copyRelatedData(preventive, schedulePreventive, _user);
        return [schedulePreventive];
    }
    // Ngày đầu tiên (đã lọc điều kiện)
    let currentDate = calculaterFirstScheduleDate(preventive, preventive.actualScheduleDate);
    // Điều kiện dừng
    let endDate = null;
    // let limitCount = null;
    switch (preventive.calendarType) {
        case calendarType.noEndDate:
            endDate = new Date(preventive.actualScheduleDate);
            endDate.setFullYear(endDate.getFullYear() + 1); // gen 1 năm
            break;
        case calendarType.endBy:
            endDate = new Date(preventive.calendarEndBy);
            break;
        case calendarType.endAfter:
            endDate = new Date(preventive.actualScheduleDate);
            endDate.setDate(endDate.getDate() + preventive.calendarEndAfter);
            break;
    }
    const createdSchedules = [];
    while (true) {
        if (endDate && currentDate > endDate) break;
        const payload = {
            ...preventive,
            code: await sequenceService.generateSequenceCode('SCHEDULE_PREVENTIVE'),
            _id: undefined,
            preventive: preventive._id,
            status: undefined,
            startDate: currentDate,
            province: assetMaintenance?.province,
            commune: assetMaintenance?.commune,
            branch: assetMaintenance?.branch,
            building: assetMaintenance?.building,
            floor: assetMaintenance?.floor,
            department: assetMaintenance?.department,
            addressNote: assetMaintenance?.addressNote,
        };
        // Lưu bản ghi
        const schedulePreventive = await SchedulePreventiveModel.create(payload);
        // Lưu lịch sử tạo mới
        await schedulePreventiveService.createSchedulePreventiveHistory({
            schedulePreventive: schedulePreventive._id,
            status: historySchedulePreventiveStatus.new,
            createdBy: _user,
        });
        // Copy dữ liệu liên quan
        await copyRelatedData(preventive, schedulePreventive, _user);
        createdSchedules.push(schedulePreventive);
        // --- TÍNH NGÀY KẾ TIẾP ĐÚNG CÁCH ---
        const nextBase = getNextBaseDate(preventive, currentDate); // cộng theo đơn vị đúng
        let nextDate = calculaterFirstScheduleDate(preventive, nextBase); // canh theo điều kiện (thứ/giờ...)
        // Chống kẹt vòng lặp nếu hàm trả về cùng ngày hoặc lùi ngày
        if (!nextDate || nextDate <= currentDate) {
            const tmp = new Date(currentDate);
            tmp.setMinutes(tmp.getMinutes() + 1);
            nextDate = calculaterFirstScheduleDate(preventive, tmp);
            if (!nextDate || nextDate <= currentDate) break; // vẫn không tiến được thì dừng
        }
        currentDate = nextDate;
    }
    return createdSchedules;
};
const generateSchedulePrenventive = async (preventiveId, _user) => {
    const preventive = await PreventiveModel.findById(preventiveId).lean();
    if (!preventive) throw new Error('Preventive không tồn tại');
    const assetMaintenance = await AssetMaintenance.findById(preventive.assetMaintenance);
    // Nếu là loại "date" => chỉ tạo 1 lần
    const data = {
        preventive: preventive._id,
        startDate: new Date(), // trả về kiểu Date thay vì timestamp
        createdBy: _user,
        supervisor: preventive.supervisor,
    };
    if (preventive.scheduleType === scheduleBasedOnType.monitoring) {
        await preventiveMonitoringService.createPreventiveMonitoring(data, preventive.initialValue);
    } else if (preventive.scheduleType === scheduleBasedOnType.adhoc) {
        await copyDataSchedulePreventiveByPreventive(preventive, _user, Date.now());
    } else if (preventive.scheduleType === scheduleBasedOnType.calendarOrMonitoring) {
        // tạo theo lịch  và tạo giám sát
        await generateSchedulePrenventiveWithCalendar(preventive, assetMaintenance, _user);
        await preventiveMonitoringService.createPreventiveMonitoring(data, preventive.initialValue);
    } else if (preventive.scheduleType === scheduleBasedOnType.calendar) {
        await generateSchedulePrenventiveWithCalendar(preventive, assetMaintenance, _user);
    } else {
        // theo tình trạng
        return;
    }
    return preventive;
};

// const generateSchedulePrenventive = async (preventiveId, _user) => {
//     const preventive = await PreventiveModel.findById(preventiveId).lean();
//     const payload = {
//         ...preventive,
//         code: await sequenceService.generateSequenceCode('SCHEDULE_PREVENTIVE'),
//         _id: undefined,
//         preventive: preventive._id,
//         status: undefined,
//         startDate: calculaterFirstScheduleDate(preventive, preventive.actualScheduleDate),
//     }
//     const schedulePreventive = await SchedulePreventiveModel.create(payload);
//     // lưu lịch sử tạo mới
//     const payloadHistorySchedulePreventive = {
//         schedulePreventive: schedulePreventive._id,
//         status: historySchedulePreventiveStatus.new,
//         createdBy: _user,
//     }
//     await schedulePreventiveService.createSchedulePreventiveHistory(payloadHistorySchedulePreventive);
//     if (preventive) {
//         // Lấy dữ liệu liên quan từ Preventive
//         const assignUsers = await PreventiveTaskAssignUserModel.find({ preventive: preventive._id }).lean();
//         const tasks = await PreventiveTaskModel.find({ preventive: preventive._id }).lean();
//         const taskIds = tasks.map((t) => t._id);
//         const taskItems = await PreventiveTaskItemModel.find({ preventiveTask: { $in: taskIds } }).lean();
//         const comments = await PreventiveCommentModel.find({ preventive: preventive._id }).lean();
//         const spareParts = await PreventiveSparePartModel.find({ preventive: preventive._id }).lean();
//         // eslint-disable-next-line no-restricted-syntax
//         for (const part of spareParts) {
//             // eslint-disable-next-line no-await-in-loop
//             await SchedulePreventiveSparePartModel.create({
//                 ...part,
//                 schedulePreventive: schedulePreventive.id,
//                 _id: undefined,
//                 preventive: preventive._id,
//             });
//         }
//         // Copy Tasks
//         const taskIdMap = {};
//         // eslint-disable-next-line no-restricted-syntax
//         for (const task of tasks) {
//             // eslint-disable-next-line no-await-in-loop
//             const newTask = await SchedulePreventiveTaskModel.create({
//                 ...task,
//                 schedulePreventive: schedulePreventive.id,
//                 _id: undefined,
//                 preventive: preventive._id,
//             });
//             taskIdMap[task._id] = newTask._id;
//         }
//         // Copy Task Items
//         // eslint-disable-next-line no-restricted-syntax
//         for (const item of taskItems) {
//             // eslint-disable-next-line no-await-in-loop
//             await SchedulePreventiveTaskItemModel.create({
//                 ...item,
//                 schedulePreventiveTask: taskIdMap[item.preventiveTask],
//                 _id: undefined,
//                 preventiveTask: undefined,
//                 preventive: preventive._id,
//             });
//         }
//         // eslint-disable-next-line no-restricted-syntax
//         for (const user of assignUsers) {
//             // eslint-disable-next-line no-await-in-loop
//             await SchedulePreventiveTaskAssignUserModel.create({
//                 ...user,
//                 schedulePreventiveTask: taskIdMap[user.preventiveTask],
//                 schedulePreventive: schedulePreventive._id,
//                 _id: undefined,
//                 preventive: preventive._id,
//             });
//             const latestSchedulePreventiveHistory = await schedulePreventiveService.getLatestSchedulePreventiveHistory();
//             // lưu lịch sử tạo mới
//             const _payloadHistorySchedulePreventive = {
//                 schedulePreventive: schedulePreventive._id,
//                 schedulePreventiveTask: taskIdMap[user.preventiveTask],
//                 status: historySchedulePreventiveStatus.assigned,
//                 createdBy: _user,
//                 assignedTo: user.user,
//                 oldStatus: latestSchedulePreventiveHistory.status,
//             }
//             await schedulePreventiveService.createSchedulePreventiveHistory(_payloadHistorySchedulePreventive);
//         }
//         // Copy Comments
//         // eslint-disable-next-line no-restricted-syntax
//         for (const comment of comments) {
//             // eslint-disable-next-line no-await-in-loop
//             await SchedulePreventiveCommentModel.create({
//                 ...comment,
//                 schedulePreventive: schedulePreventive.id,
//                 _id: undefined,
//                 preventive: preventive._id,
//             });
//         }
//     }
//     return schedulePreventive;
// }
const deletePreventiveById = async (id) => {
    const preventive = await PreventiveModel.findById(id);
    if (!preventive) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Preventive not found');
    }
    // Xóa các dữ liệu liên quan
    // await PreventiveSparePartModel.deleteMany({ preventive: id });
    // await PreventiveTaskAssignUserModel.deleteMany({ preventive: id });
    // await PreventiveCommentModel.deleteMany({ preventive: id });
    // await PreventiveTaskModel.deleteMany({ preventive: id });
    // // Xóa các PreventiveTaskItem liên quan
    // const tasks = await PreventiveTaskModel.find({ preventive: id }).select('_id');
    // const taskIds = tasks.map((task) => task._id);
    // await PreventiveTaskItemModel.deleteMany({ preventiveTask: { $in: taskIds } });
    // await PreventiveSparePartModel.deleteMany({ preventive: id });
    // Lấy các SchedulePreventive liên quan
    // tạm thười chuyển về inactive
    preventive.activity = false;
    await preventive.save();
    await schedulePreventiveService.deleteManySchedulePreventive({ preventive: id, startDate: { $gte: new Date() } });
    return preventive;
};
const getPreventiveTaskByPreventiveId = async (service) => {
    const serviceTasks = await PreventiveTaskModel.find({ preventive: service }).populate({ path: 'amc' });
    return serviceTasks;
};
const getPreventiveSaprePartByPreventiveId = async (service) => {
    const serviceTasks = await PreventiveSparePartModel.find({ preventive: service });
    return serviceTasks;
};
const getPreventiveTaskItemByTaskId = async (taskId) => {
    const serviceTaskItems = await PreventiveTaskItemModel.find({ preventiveTask: taskId });
    return serviceTaskItems;
};
const getPreventiveTaskAssignUserByTaskId = async (taskId) => {
    const preventiveTaskAssignUsers = await PreventiveTaskAssignUserModel.find({ preventiveTask: taskId }).populate({
        path: 'user',
    });
    return preventiveTaskAssignUsers;
};
const getResAssignUserByPreventive = async (preventive) => {
    // Lấy danh sách user có userType là charge và preventive tương ứng
    const users = await PreventiveTaskAssignUserModel.find({
        preventive,
        userType: schedulePreventiveUserType.charge,
    }).populate({
        path: 'user',
        select: 'fullName ',
    });
    return users;
};

const comfirmReAssignUser = async (preventive, dataUpdate) => {
    await PreventiveTaskAssignUserModel.deleteMany({
        preventive,
        userType: schedulePreventiveUserType.charge,
    });
    await PreventiveTaskAssignUserModel.create({
        ...dataUpdate,
        preventive,
        userType: schedulePreventiveUserType.charge,
    });
    await PreventiveCommentModel.create({ ...dataUpdate });
    // Lấy tất cả SchedulePreventive liên quan đến preventive này
    const schedules = await SchedulePreventiveModel.find({
        preventive,
        workingStatus: { $nin: ['confirmed', 'completed', 'skipped', 'processing'] },
        // //bỏ qua các tk này dax
        statusType: { $nin: ['InProgess', 'Overdue'] },
    }).select('_id');

    const scheduleIds = schedules.map((s) => s._id);
    await SchedulePreventiveModel.updateMany(
        {
            _id: { $in: scheduleIds },
            statusType: { $nin: ['Upcoming'] },
        },
        { $set: { statusType: statusType.New, workingStatus: schedulePreventiveWorkingStatus.assign } }
    );
    // Xóa user charge cũ trong SchedulePreventiveTaskAssignUserModel
    await SchedulePreventiveTaskAssignUserModel.deleteMany({
        schedulePreventive: { $in: scheduleIds },
        userType: schedulePreventiveUserType.charge,
    });
    // eslint-disable-next-line no-restricted-syntax
    for (const schedulePreventiveId of scheduleIds) {
        // eslint-disable-next-line no-await-in-loop
        const count = await schedulePreventiveService.getCountSchedulePrevetiveTaskAssignUserByTask(schedulePreventiveId);
        if (count > 1) {
            throw new ApiError('Một công việc chỉ được phép giao cho 1 kỹ sư thực hiện');
        }
        await SchedulePreventiveTaskAssignUserModel.create({
            schedulePreventive: schedulePreventiveId,
            ...dataUpdate,
            userType: schedulePreventiveUserType.charge,
        });
    }
    await PreventiveModel.findByIdAndUpdate(preventive, { $set: { status: ticketPreventiveStatus.start } });
};

const createPreventiveComment = async (preventiveComment) => {
    const _createPreventiveComment = await PreventiveCommentModel.create(preventiveComment);
    return _createPreventiveComment;
};
const getPreventiveComments = async (filter, options) => {
    const preventiveFilter = { ...filter };
    // Đổi preventiveId thành preventive nếu schema là preventive
    if (filter.preventive && mongoose.Types.ObjectId.isValid(filter.preventive)) {
        preventiveFilter.preventive = new mongoose.Types.ObjectId(filter.preventive);
    }
    const preventives = await PreventiveCommentModel.paginate(preventiveFilter, {
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
// const getPreventiveByConditionBasedSchedule = async (filter, options, user) => {
//     filter.activity = true;
//     filter.scheduleType = scheduleBasedOnType.conditionBasedSchedule;
//     filter.isStart = true;
//     // filter.supervisor = mongoose.Types.ObjectId(user);
//     const preventives = await PreventiveModel.paginate(filter, {
//         ...options,
//         populate: [
//             {
//                 path: 'assetMaintenance',
//                 populate: [
//                     {
//                         path: 'assetModel',
//                         populate: [
//                             { path: 'customer' },
//                             { path: 'asset' },
//                             { path: 'category' },
//                             { path: 'manufacturer' },
//                             { path: 'subCategory' },
//                         ],
//                     },
//                     { path: 'customer' },
//                 ],
//             },
//             {
//                 path: 'supervisor',
//             },
//         ],
//     });
//     return preventives;
// };
const getPreventiveByConditionBasedSchedule = async (filter, options, user) => {
    const page = parseInt(options.page) || 1;
    const limit = parseInt(options.limit) || 10;
    const sortBy = options.sortBy || 'createdAt';
    const sortOrder = options.sortOrder || 'desc';
    const sortStage = {};
    sortStage[sortBy] = sortOrder === 'asc' ? 1 : -1;
    const skip = (page - 1) * limit;

    const matchStage = {
        activity: true,
        scheduleType: scheduleBasedOnType.conditionBasedSchedule,
        isStart: true,
        supervisor: mongoose.Types.ObjectId(user),
        ...(filter.code && { code: { $regex: filter.code, $options: 'i' } }),
        // ...(filter.customer && { customer: mongoose.Types.ObjectId(filter.customer) }),
        ...(filter.supervisor && { supervisor: mongoose.Types.ObjectId(filter.supervisor) }),
    };

    const searchConditions = [];
    if (filter.searchText) {
        searchConditions.push(
            { code: { $regex: filter.searchText, $options: 'i' } },
            { 'assetMaintenance.asset.assetName': { $regex: filter.searchText, $options: 'i' } },
            { 'assetMaintenance.assetModel.assetModelName': { $regex: filter.searchText, $options: 'i' } },
            { 'assetMaintenance.serial': { $regex: filter.searchText, $options: 'i' } },
            { 'assetMaintenance.assetNumber': { $regex: filter.searchText, $options: 'i' } },
            { 'supervisor.fullName': { $regex: filter.searchText, $options: 'i' } },
            { 'assetMaintenance.customer.customerName': { $regex: filter.searchText, $options: 'i' } }
        );
    }
    if (filter.assetName) {
        searchConditions.push({
            'assetMaintenance.asset.assetName': { $regex: filter.assetName, $options: 'i' },
        });
    }
    if (filter.assetModelName) {
        searchConditions.push({
            'assetMaintenance.assetModel.assetModelName': { $regex: filter.assetModelName, $options: 'i' },
        });
    }
    if (filter.serial) {
        searchConditions.push({
            'assetMaintenance.serial': { $regex: filter.serial, $options: 'i' },
        });
    }
    if (filter.assetNumber) {
        searchConditions.push({
            'assetMaintenance.assetNumber': { $regex: filter.assetNumber, $options: 'i' },
        });
    }
    if (filter.customerName) {
        searchConditions.push({
            'assetMaintenance.customer.customerName': { $regex: filter.customerName, $options: 'i' },
        });
    }
    if (filter.supervisorName) {
        searchConditions.push({
            'supervisor.fullName': { $regex: filter.serviceContractorName, $options: 'i' },
        });
    }
    if (filter.customer) {
        searchConditions.push({
            'assetMaintenance.customer._id': mongoose.Types.ObjectId(filter.customer),
        });
    }

    const aggregate = [
        {
            $match: matchStage,
        },
        {
            $lookup: {
                from: 'assetmaintenances',
                localField: 'assetMaintenance',
                foreignField: '_id',
                pipeline: [
                    {
                        $lookup: {
                            from: 'assetmodels',
                            localField: 'assetModel',
                            foreignField: '_id',
                            as: 'assetModel',
                        },
                    },
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
                            as: 'branch',
                        },
                    },
                    {
                        $lookup: {
                            from: 'departments',
                            localField: 'department',
                            foreignField: '_id',
                            as: 'department',
                        },
                    },
                    { $unwind: { path: '$department', preserveNullAndEmptyArrays: true } },
                    { $unwind: { path: '$branch', preserveNullAndEmptyArrays: true } },
                    { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } },
                    { $unwind: { path: '$assetModel', preserveNullAndEmptyArrays: true } },
                    { $unwind: { path: '$asset', preserveNullAndEmptyArrays: true } },
                ],
                as: 'assetMaintenance',
            },
        },
        {
            $lookup: {
                from: 'users',
                localField: 'supervisor',
                foreignField: '_id',
                as: 'supervisor',
            },
        },
        { $unwind: { path: '$assetMaintenance', preserveNullAndEmptyArrays: true } },
        { $unwind: { path: '$supervisor', preserveNullAndEmptyArrays: true } },
        ...(searchConditions.length > 0 ? [{ $match: { $or: searchConditions } }] : []),
        { $sort: sortStage },
    ];

    const countAggregates = [...aggregate, { $count: 'totalCount' }];
    const fullAggregates = [...aggregate, { $skip: skip }, { $limit: limit }];

    const [preventives, countPreventives] = await Promise.all([
        PreventiveModel.aggregate(fullAggregates),
        PreventiveModel.aggregate(countAggregates),
    ]);

    const totalResults = countPreventives.length > 0 ? countPreventives[0].totalCount : 0;
    const totalPages = Math.ceil(totalResults / limit);
    return {
        preventives,
        page: page,
        limit: limit,
        totalPages: totalPages,
        totalResults: totalResults,
    };
};
const getAllPreventiveConditionBasedSchedule = async (preventive) => {
    const preventiveConditionBaseds = await PreventiveConditionBasedModel.find({ preventive })
        .populate({ path: 'uom' })
        .sort({
            createdAt: -1,
        });
    return preventiveConditionBaseds;
};
const generateSchedulePrenventiveByPreventiveConditionBasedSchedule = async (measurements, note, preventiveId, userId) => {
    const preventive = await PreventiveModel.findById(preventiveId).lean();
    if (!preventive) throw new Error('Preventive không tồn tại');
    if (preventive.isStart === false) throw new Error('Preventive chưa bắt đầu');
    const preventiveConditionBasedHistory = await PreventiveConditionBasedHistoryModel.create({
        preventive: preventiveId,
        preventiveOfModel: preventive?.preventiveOfModel || null,
        note,
        createdBy: userId,
    });
    for (const measurement of measurements) {
        const preventiveConditionBased = await PreventiveConditionBasedModel.findById(measurement.id);
        if (!preventiveConditionBased) continue;
        await PreventiveConditionBasedHistoryDetailModel.create({
            preventiveConditionBasedHistory: preventiveConditionBasedHistory._id,
            preventiveConditionBased: measurement.id || measurement._id,
            value: measurement.oldVal,
            measuredValue: measurement.value,
            measuredAt: measurement.measuredAt,
            condition: preventiveConditionBased.condition,
            uom: preventiveConditionBased.uom,
        });
    }
    const shouldCreateSchedule = measurements.some((m) => Number(m.value) >= Number(m.oldVal));
    if (!shouldCreateSchedule) return null;
    const schedulePreventive = await copyDataSchedulePreventiveByPreventive(preventive, userId, Date.now());
    return schedulePreventive;
};
const getAllPreventiveConditionBasedScheduleHistoryByPreventive = async (preventive) => {
    const preventiveConditionBasedHistory = await PreventiveConditionBasedHistoryModel.find({ preventive }).sort({
        createdAt: -1,
    });
    return preventiveConditionBasedHistory;
};
const getPreventiveConditionBasedHistoryDetailsByHistoryId = async (historyId) => {
    const preventiveConditionBasedHistoryDetails = await PreventiveConditionBasedHistoryDetailModel.find({
        preventiveConditionBasedHistory: historyId,
    })
        .populate({ path: 'uom' })
        .populate({ path: 'preventiveConditionBased' });
    return preventiveConditionBasedHistoryDetails;
};
const getpreventiveConditionBasedsByPreventive = async (preventive) => {
    const preventiveConditionBaseds = await PreventiveConditionBasedModel.find({ preventive });
    return preventiveConditionBaseds;
};
const changeOfContractPreventive = async (id, data) => {
    const preventive = await PreventiveModel.findById(id);
    if (!preventive) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Preventive not found');
    }
    Object.assign(preventive, data.preventive);
    await preventive.save();
    // Xóa các dữ liệu liên quan cũ
    const tasks = await PreventiveTaskModel.find({ preventive: id }).select('_id');
    const taskIds = tasks.map((task) => task._id);
    await PreventiveTaskItemModel.deleteMany({ preventiveTask: { $in: taskIds } });
    await PreventiveTaskAssignUserModel.deleteMany({ preventiveTask: { $in: taskIds } });
    await PreventiveSparePartModel.deleteMany({ preventive: id });
    await PreventiveTaskModel.deleteMany({ preventive: id });

    if (data.preventiveSpareParts && data.preventiveSpareParts.length > 0) {
        // eslint-disable-next-line no-plusplus
        for (let i = 0; i < data.preventiveSpareParts.length; i++) {
            const part = data.preventiveSpareParts[i];
            part.preventive = preventive._id;
            // eslint-disable-next-line no-await-in-loop
            await PreventiveSparePartModel.create(part);
        }
    }
    // Thêm lại các Task và TaskItem mới
    if (data.preventiveTasks && data.preventiveTasks.length > 0) {
        // eslint-disable-next-line no-plusplus
        for (let i = 0; i < data.preventiveTasks.length; i++) {
            const task = data.preventiveTasks[i];
            delete task._id; // Xóa _id nếu có
            task.preventive = preventive._id;
            // eslint-disable-next-line no-await-in-loop
            const newTask = await PreventiveTaskModel.create(task);

            if (task.taskItems && task.taskItems.length > 0) {
                // eslint-disable-next-line no-plusplus
                for (let j = 0; j < task.taskItems.length; j++) {
                    const item = task.taskItems[j];
                    item.preventiveTask = newTask._id;
                    item.preventive = preventive._id;
                    // eslint-disable-next-line no-await-in-loop
                    await PreventiveTaskItemModel.create(item);
                }
            }
        }
    }
    return preventive;
};
const getPreventiveBySchedulePreventive = async (schedulePreventiveId) => {
    const preventive = await SchedulePreventiveModel.findOne({ _id: schedulePreventiveId })
        .populate([
            {
                path: 'preventive',
                populate: [
                    {
                        path: 'assetMaintenance',
                        populate: [
                            { path: 'branch', select: 'name' },
                            { path: 'department', select: 'departmentName' },
                        ],
                    },
                ],
            },
        ])
        .lean();
    return preventive;
};
module.exports = {
    queryPreventives,
    getPreventiveById,
    updatePreventiveById,
    deletePreventiveById,
    createPreventive,
    updateStatus,
    getPreventiveTaskItemByTaskId,
    getPreventiveTaskByPreventiveId,
    getPreventiveSaprePartByPreventiveId,
    getResAssignUserByPreventive,
    comfirmReAssignUser,
    getPreventiveTaskAssignUserByTaskId,
    startPreventive,
    generateSchedulePrenventive,
    createPreventiveComment,
    getPreventiveComments,
    copyDataSchedulePreventiveByPreventive,
    getPreventiveByConditionBasedSchedule,
    getAllPreventiveConditionBasedSchedule,
    generateSchedulePrenventiveByPreventiveConditionBasedSchedule,
    getAllPreventiveConditionBasedScheduleHistoryByPreventive,
    getPreventiveConditionBasedHistoryDetailsByHistoryId,
    getpreventiveConditionBasedsByPreventive,
    changeOfContractPreventive,
    getPreventiveBySchedulePreventive,
};
