const httpStatus = require('http-status');
const {
    SchedulePreventiveModel,
    SchedulePreventiveTaskAssignUserModel,
    SchedulePreventiveCheckinCheckOutModel,
    Customer,
    AssetModel,
    AssetMaintenance,
    PreventiveModel,
    Asset,
    User,
    Department,
} = require('../../models');
const {
    ticketBreakdownStatus,
    schedulePreventiveStatus,
    ticketSchedulePreventiveStatus,
    breakdownSpareRequestDetailStatus,
    breakdownStatus,
    schedulePreventiveTaskAssignUserStatus,
} = require('../../utils/constant');
const ApiError = require('../../utils/ApiError');
const { Types } = require('mongoose');

const getTotalParameterSchedulePreventive = async (startDate, endDate, filter, req) => {
    const queryFilter = {};

    // kiểm tra xem có được xem tất cả tài sản không
    let allowViewAll = true;
    if (req.companySetting.filterByAccount) {
        const dep = await Department.findById(req.user.department).select('allowViewAll');
        allowViewAll = dep?.allowViewAll;
    }
    const amQuery = {};
    if (filter.branchs && Array.isArray(filter.branchs) && filter.branchs.length > 0) {
        amQuery.branch = { $in: filter.branchs.map(id => Types.ObjectId(id)) };
    }
    if (!allowViewAll) {
        amQuery.department = Types.ObjectId(req?.user?.department);
    }

    if (Object.keys(amQuery).length > 0) {
        const validAssetMaintenances = await AssetMaintenance.find(amQuery).select('_id');
        const amIds = validAssetMaintenances.map(asset => asset._id);
        queryFilter.assetMaintenance = { $in: amIds };
    }

    if (filter.code) {
        queryFilter.code = { $regex: filter.code, $options: 'i' };
    }
    if (filter.status) {
        queryFilter.status = filter.status;
    }
    if (filter.customerName) {
        const customers = await Customer.find({
            customerName: { $regex: filter.customerName, $options: 'i' }
        }).select('_id');
        const customerIds = customers.map(c => c._id);
        queryFilter.customer = { $in: customerIds };
    }
    if (filter.preventiveName) {
        const preventives = await PreventiveModel.find({
            preventiveName: { $regex: filter.preventiveName, $options: 'i' }
        }).select('_id');
        queryFilter.preventive = { $in: preventives.map(p => p._id) };
    }
    if (filter.assetName || filter.assetModelName) {
        let amQuery = {};
        if (filter.assetName) {
            const assets = await Asset.find({
                assetName: { $regex: filter.assetName, $options: 'i' }
            }).select('_id');
            amQuery.asset = { $in: assets.map(a => a._id) };
        }
        if (filter.assetModelName) {
            const assetModels = await AssetModel.find({
                assetModelName: { $regex: filter.assetModelName, $options: 'i' }
            }).select('_id');
            amQuery.assetModel = { $in: assetModels.map(a => a._id) };
        }
        const amIds = await AssetMaintenance.find(amQuery).select('_id');
        queryFilter.assetMaintenance = { $in: amIds.map(a => a._id) };
    }
    const totalSchedulePreventiveNews = await SchedulePreventiveModel.countDocuments({
        startDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
        ticketStatus: ticketSchedulePreventiveStatus.new,
        ...queryFilter,
    });

    const totalSchedulePreventiveInProgress = await SchedulePreventiveModel.countDocuments({
        startDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
        ticketStatus: ticketSchedulePreventiveStatus.inProgress,
        ...queryFilter,
    });

    const totalSchedulePreventiveOverdues = await SchedulePreventiveModel.countDocuments({
        startDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
        ticketStatus: { $in: [ticketSchedulePreventiveStatus.inProgress, ticketSchedulePreventiveStatus.new] },
        $expr: {
            $lte: [
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
        ...queryFilter,
    });
    const totalSchedulePreventiveCompleteds = await SchedulePreventiveModel.countDocuments({
        startDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
        ticketStatus: ticketSchedulePreventiveStatus.history,
        status: schedulePreventiveStatus.completed,
        ...queryFilter,
    });

    const totalSchedulePreventiveCancelleds = await SchedulePreventiveModel.countDocuments({
        startDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
        ticketStatus: ticketSchedulePreventiveStatus.history,
        status: schedulePreventiveStatus.cancelled,
        ...queryFilter,
    });

    const totalSchedulePreventiveSkippeds = await SchedulePreventiveModel.countDocuments({
        startDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
        ticketStatus: ticketSchedulePreventiveStatus.history,
        status: schedulePreventiveStatus.skipped,
        ...queryFilter,
    });

    const totalAllSchedulePreventives = await SchedulePreventiveModel.countDocuments({
        startDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
        ...queryFilter,
    });

    const schedulePreventives = await SchedulePreventiveModel.aggregate([
        {
            $match: {
                startDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
                status: { $ne: schedulePreventiveStatus.cancelled },
                ...queryFilter,
            },
        },
        {
            $group: {
                _id: null,
                totalPlannedHours: {
                    $sum: {
                        $add: [
                            { $multiply: ['$maintenanceDurationHr', 60 * 60 * 1000] },
                            { $multiply: ['$maintenanceDurationMin', 60 * 1000] },
                        ],
                    },
                },
                totalDowntime: {
                    $sum: {
                        $add: [{ $multiply: ['$downtimeHr', 60 * 60 * 1000] }, { $multiply: ['$downtimeMin', 60 * 1000] }],
                    },
                },
            },
        },
    ]);
    const totalPlannedHours = schedulePreventives.length > 0 ? schedulePreventives[0].totalPlannedHours : 0;
    const totalDowntime = schedulePreventives.length > 0 ? schedulePreventives[0].totalDowntime : 0;
    return {
        totalSchedulePreventiveNews,
        totalSchedulePreventiveInProgress,
        totalSchedulePreventiveOverdues,
        totalSchedulePreventiveCompleteds,
        totalSchedulePreventiveCancelleds,
        totalSchedulePreventiveSkippeds,
        totalAllSchedulePreventives,
        totalPlannedHours,
        totalDowntime,
    };
};
const getSumaryProcecssingSattusSchedulePreventive = async (startDate, endDate, options, filter, req) => {
    const limit = Number(options.limit) || 10;
    const page = Number(options.page) || 1;

    const filterMatch = {};
    // kiểm tra xem có được xem tất cả tài sản không
    let allowViewAll = true;
    if (req.companySetting.filterByAccount) {
        const dep = await Department.findById(req.user.department).select('allowViewAll');
        allowViewAll = dep?.allowViewAll;
    }
    const amQuery = {};
    if (filter.branchs && Array.isArray(filter.branchs) && filter.branchs.length > 0) {
        amQuery.branch = { $in: filter.branchs.map(id => Types.ObjectId(id)) };
    }
    if (!allowViewAll) {
        amQuery.department = Types.ObjectId(req?.user?.department);
    }

    if (Object.keys(amQuery).length > 0) {
        const validAssetMaintenances = await AssetMaintenance.find(amQuery).select('_id');
        const amIds = validAssetMaintenances.map(asset => asset._id);
        filterMatch.assetMaintenance = { $in: amIds };
    }

    let customerIds = [];
    if (filter.customerName) {
        const customers = await Customer.find({
            customerName: { $regex: filter.customerName, $options: 'i' }
        }).select('_id');
        customerIds = customers.map(c => c._id);
    }
    let assetModelIds = [];
    if (filter.assetModelName) {
        const assetModels = await AssetModel.find({
            assetModelName: { $regex: filter.assetModelName, $options: 'i' }
        }).select('_id');
        assetModelIds = assetModels.map(c => c._id);
    }
    // let maintenanceIds = [];
    // if (filter.assetModelName) {
    //     const assetModels = await AssetModel.find({
    //         assetModelName: { $regex: filter.assetModelName, $options: 'i' }
    //     }).select('_id');
    //     const amIds = assetModels.map(m => m._id);

    //     const maintenances = await AssetMaintenance.find({
    //         assetModel: { $in: amIds }
    //     }).select('_id');
    //     maintenanceIds = maintenances.map(m => m._id);
    // }
    const searchAggregaates = [
        {
            $match: {
                startDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
                ...(filter.customerName && { customer: { $in: customerIds } }),
                // ...(filter.assetModelName && { assetMaintenance: { $in: maintenanceIds } }),
                ...filterMatch,
            },
        },
        {
            $lookup: {
                from: 'customers',
                localField: 'customer', // dùng field gốc
                foreignField: '_id',
                as: 'customer',
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
                from: 'assetmodels',
                localField: 'assetMaintenance.assetModel',
                foreignField: '_id',
                as: 'assetModel',
            },
        },
        { $unwind: { path: '$assetModel', preserveNullAndEmptyArrays: true } },
        { $unwind: { path: '$assetMaintenance', preserveNullAndEmptyArrays: true } },
        { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } },
        ...(filter.assetModelName ? [{
            $match: { "assetModel._id": { $in: assetModelIds } }
        }] : []),
        {
            $group: {
                _id: {
                    customerId: '$customer._id',
                    customerName: '$customer.customerName',
                    assetModelId: '$assetModel._id',
                    assetModelName: '$assetModel.assetModelName',
                },
                downtime: {
                    $sum: {
                        $cond: [
                            { $eq: ['$status', schedulePreventiveStatus.cancelled] }, // nếu cancel
                            0,
                            {
                                $add: [
                                    { $multiply: ['$downtimeHr', 60 * 60 * 1000] },
                                    { $multiply: ['$downtimeMin', 60 * 1000] },
                                ],
                            },
                        ],
                    },
                },
                plannedHours: {
                    $sum: {
                        $cond: [
                            { $eq: ['$status', schedulePreventiveStatus.cancelled] },
                            0,
                            {
                                $add: [
                                    { $multiply: ['$maintenanceDurationHr', 60 * 60 * 1000] },
                                    { $multiply: ['$maintenanceDurationMin', 60 * 1000] },
                                ],
                            },
                        ],
                    },
                },
                totalNew: { $sum: { $cond: [{ $eq: ['$ticketStatus', ticketSchedulePreventiveStatus.new] }, 1, 0] } },
                totalInProgress: {
                    $sum: { $cond: [{ $eq: ['$ticketStatus', ticketSchedulePreventiveStatus.inProgress] }, 1, 0] },
                },
                totalCompleted: { $sum: { $cond: [{ $eq: ['$status', schedulePreventiveStatus.completed] }, 1, 0] } },
                totalCancelled: { $sum: { $cond: [{ $eq: ['$status', schedulePreventiveStatus.cancelled] }, 1, 0] } },
                totalSkipped: { $sum: { $cond: [{ $eq: ['$status', schedulePreventiveStatus.skipped] }, 1, 0] } },
                totalOverdue: {
                    $sum: {
                        $cond: [
                            {
                                $in: [
                                    '$ticketStatus',
                                    [ticketSchedulePreventiveStatus.new, ticketSchedulePreventiveStatus.inProgress],
                                ],
                            },
                            1,
                            0,
                        ],
                    },
                },
                total: { $sum: 1 },
            },
        },
        {
            $project: {
                _id: 0,
                customerId: '$_id.customerId',
                customerName: '$_id.customerName',
                assetModelId: '$_id.assetModelId',
                assetModelName: '$_id.assetModelName',
                downtime: 1,
                plannedHours: 1,
                total: 1,
                totalNew: 1,
                totalInProgress: 1,
                totalOverdue: 1,
                totalCompleted: 1,
                totalCancelled: 1,
                totalSkipped: 1,
            },
        },
    ];

    if (options.sortBy && options.sortOrder) {
        searchAggregaates.push({
            $sort: { [options.sortBy]: options.sortOrder },
        });
    }

    const pagzingAggregaates = [{ $skip: (page - 1) * limit }, { $limit: limit }];

    const scheduleGroups = await SchedulePreventiveModel.aggregate([...searchAggregaates, ...pagzingAggregaates]);

    const countAggregaates = [{ $count: 'totalResults' }];
    const totalResultsArr = await SchedulePreventiveModel.aggregate([...searchAggregaates, ...countAggregaates]);

    const totalResults = totalResultsArr[0]?.totalResults || 0;
    const totalPages = Math.ceil(totalResults / limit);

    return {
        scheduleGroups,
        page,
        limit,
        totalPages,
        totalResults,
    };
};

const getDetailsProcecssingSattusSchedulePreventive = async (startDate, endDate, options, filter, req) => {
    const query = {
        startDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
    }
    if (filter.code) {
        query.code = { $regex: filter.code, $options: 'i' };
    }
    if (filter.status) {
        query.status = filter.status;
    }
    if (filter.customerName) {
        const customers = await Customer.find({
            customerName: { $regex: filter.customerName, $options: 'i' },
        }).select('_id');
        query.customer = { $in: customers.map(c => c._id) };
    }
    if (filter.preventiveName) {
        const preventives = await PreventiveModel.find({
            preventiveName: { $regex: filter.preventiveName, $options: 'i' }
        }).select('_id');
        query.preventive = { $in: preventives.map(p => p._id) };
    }

    // kiểm tra xem có được xem tất cả tài sản không
    let allowViewAll = true;
    if (req.companySetting.filterByAccount) {
        const dep = await Department.findById(req.user.department).select('allowViewAll');
        allowViewAll = dep?.allowViewAll;
    }
    const amQuery = {};
    if (filter.branchs && Array.isArray(filter.branchs) && filter.branchs.length > 0) {
        amQuery.branch = { $in: filter.branchs.map(id => Types.ObjectId(id)) };
    }
    if (!allowViewAll) {
        amQuery.department = Types.ObjectId(req?.user?.department);
    }

    if (filter.assetName) {
        const assets = await Asset.find({
            assetName: { $regex: filter.assetName, $options: 'i' }
        }).select('_id');
        amQuery.asset = { $in: assets.map(a => a._id) };
    }
    if (filter.assetModelName) {
        const assetModels = await AssetModel.find({
            assetModelName: { $regex: filter.assetModelName, $options: 'i' }
        }).select('_id');
        amQuery.assetModel = { $in: assetModels.map(a => a._id) };
    }
    if (Object.keys(amQuery).length > 0) {
        const validAssetMaintenances = await AssetMaintenance.find(amQuery).select('_id');
        const amIds = validAssetMaintenances.map(asset => asset._id);
        query.assetMaintenance = { $in: amIds };
    }
    const schedulePreventives = await SchedulePreventiveModel.paginate(
        // {
        //     startDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
        // },
        query,
        {
            ...options,
            populate: [
                { path: 'createdBy' },
                { path: 'customer' },
                { path: 'preventive' },
                {
                    path: 'assetMaintenance',
                    populate: {
                        path: 'assetModel',
                        populate: { path: 'asset' },
                    },
                },
            ],
        }
    );
    return schedulePreventives;
};
const getAllSchedulePrevenTaskAssignUserStatus = async (startDate, endDate, filter, filterMatch) => {
    const statuses = schedulePreventiveTaskAssignUserStatus;
    let userIds = [];
    if (filter.fullName) {
        const users = await User.find({
            fullName: { $regex: filter.fullName, $options: 'i' }
        }).select('_id');
        userIds = users.map(c => c._id);
    }
    // Lấy dữ liệu từ SchedulePreventiveTaskAssignUserModel
    const taskAssignUsers = await SchedulePreventiveTaskAssignUserModel.aggregate([
        {
            $lookup: {
                from: 'schedulepreventives',
                localField: 'schedulePreventive',
                foreignField: '_id',
                as: 'schedulePreventive',
            },
        },
        { $unwind: '$schedulePreventive' },
        {
            $match: {
                'schedulePreventive.startDate': {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate),
                },
                isCancel: false,
                ...(filter.fullName && { user: { $in: userIds } }),
                ...(filter.code && { 'schedulePreventive.code': { $regex: filter.code, $options: 'i' } }),
                ...(filter.status && { status: filter.status }),
                ...(filterMatch.assetMaintenance && { 'schedulePreventive.assetMaintenance': filterMatch.assetMaintenance }),
            },
        },
        {
            $group: {
                _id: null,
                totalSchedulePreventiveTaskAssignUserNew: {
                    $sum: {
                        $cond: [{ $in: ['$status', [statuses.accepted, statuses.assigned]] }, 1, 0],
                    },
                },
                totalSchedulePreventiveTaskAssignUserInProgess: {
                    $sum: {
                        $cond: [
                            {
                                $in: [
                                    '$status',
                                    [
                                        statuses.inProgress,
                                        statuses.partiallyCompleted,
                                        statuses.submitted,
                                        statuses.approved,
                                        statuses.pendingApproval,
                                    ],
                                ],
                            },
                            1,
                            0,
                        ],
                    },
                },
                totalSchedulePreventiveTaskAssignUserRejected: {
                    $sum: {
                        $cond: [{ $eq: ['$status', statuses.reassignment] }, 1, 0],
                    },
                },
                totalSchedulePreventiveTaskAssignUserClosed: {
                    $sum: {
                        $cond: [
                            {
                                $in: [
                                    '$status',
                                    [
                                        statuses.skipped,
                                        statuses.completed,
                                        statuses.cancelled,
                                        statuses.reopen,
                                        statuses.replacement,
                                    ],
                                ],
                            },
                            1,
                            0,
                        ],
                    },
                },
                totalSchedulePreventiveTaskAssignUsers: { $sum: 1 },
                schedulePreventiveTaskIds: { $addToSet: '$schedulePreventiveTask' }, // Lấy danh sách taskIds
            },
        },
    ]);
    const result = taskAssignUsers[0] || { taskIds: [] };
    const schedulePreventivesCheckin = await SchedulePreventiveCheckinCheckOutModel.aggregate([
        {
            $match: {
                schedulePreventiveTask: { $in: result.schedulePreventiveTaskIds || [] },
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
    const totalTimeConsumed = schedulePreventivesCheckin[0]?.totalTimeConsumed || 0;
    return {
        ...result,
        totalTimeConsumed,
    };
};

const getSummaryReportEngineerPerformanceInSchedulePreventive = async (startDate, endDate, options, filter, req) => {
    const limit = Number(options.limit) || 10;
    const page = Number(options.page) || 1;
    const filterMatch = {};
    // kiểm tra xem có được xem tất cả tài sản không
    let allowViewAll = true;
    if (req.companySetting.filterByAccount) {
        const dep = await Department.findById(req.user.department).select('allowViewAll');
        allowViewAll = dep?.allowViewAll;
    }
    const amQuery = {};
    if (filter.branchs && Array.isArray(filter.branchs) && filter.branchs.length > 0) {
        amQuery.branch = { $in: filter.branchs.map(id => Types.ObjectId(id)) };
    }
    if (!allowViewAll) {
        amQuery.department = Types.ObjectId(req?.user?.department);
    }

    if (Object.keys(amQuery).length > 0) {
        const validAssetMaintenances = await AssetMaintenance.find(amQuery).select('_id');
        const amIds = validAssetMaintenances.map(asset => asset._id);
        filterMatch.assetMaintenance = { $in: amIds };
    }

    const allTotalStatusScheduleAssignUser = await getAllSchedulePrevenTaskAssignUserStatus(startDate, endDate, filter, filterMatch);
    const searchAggregaates = [
        {
            $lookup: {
                from: 'schedulepreventives',
                localField: 'schedulePreventive',
                foreignField: '_id',
                as: 'schedulePreventive',
            },
        },
        { $unwind: '$schedulePreventive' },
        {
            $match: {
                'schedulePreventive.startDate': { $gte: new Date(startDate), $lte: new Date(endDate) },
                isCancel: false,
                ...(filterMatch.assetMaintenance && { 'schedulePreventive.assetMaintenance': filterMatch.assetMaintenance }),
            },
        },
        {
            $lookup: {
                from: 'schedulepreventivecheckincheckouts', // tên collection đúng
                localField: 'schedulePreventiveTask', // _id của SchedulePreventiveTaskAssignUser
                foreignField: 'schedulePreventiveTask', // trường liên kết bên checkin/checkout
                as: 'checkins',
            },
        },
        {
            $group: {
                _id: {
                    userId: '$user',
                },
                total: { $sum: 1 },
                totalNew: {
                    $sum: {
                        $cond: [
                            {
                                $in: [
                                    '$status',
                                    [
                                        schedulePreventiveTaskAssignUserStatus.accepted,
                                        schedulePreventiveTaskAssignUserStatus.assigned,
                                    ],
                                ],
                            },
                            1,
                            0,
                        ],
                    },
                },
                totalInProgress: {
                    $sum: {
                        $cond: [
                            {
                                $in: [
                                    '$status',
                                    [
                                        schedulePreventiveTaskAssignUserStatus.inProgress,
                                        schedulePreventiveTaskAssignUserStatus.partiallyCompleted,
                                        schedulePreventiveTaskAssignUserStatus.submitted,
                                        schedulePreventiveTaskAssignUserStatus.approved,
                                        schedulePreventiveTaskAssignUserStatus.pendingApproval,
                                    ],
                                ],
                            },
                            1,
                            0,
                        ],
                    },
                },
                totalRejected: {
                    $sum: { $cond: [{ $eq: ['$status', schedulePreventiveTaskAssignUserStatus.reassignment] }, 1, 0] },
                },
                totalClosed: {
                    $sum: {
                        $cond: [
                            {
                                $in: [
                                    '$status',
                                    [
                                        schedulePreventiveTaskAssignUserStatus.cancelled,
                                        schedulePreventiveTaskAssignUserStatus.skipped,
                                        schedulePreventiveTaskAssignUserStatus.completed,
                                        schedulePreventiveTaskAssignUserStatus.reopen,
                                        schedulePreventiveTaskAssignUserStatus.replacement,
                                    ],
                                ],
                            },
                            1,
                            0,
                        ],
                    },
                },
                totalTimeConsumed: {
                    $sum: {
                        $reduce: {
                            input: '$checkins',
                            initialValue: 0,
                            in: {
                                $add: [
                                    '$$value',
                                    {
                                        $subtract: [
                                            { $ifNull: ['$$this.checkOutDateTime', new Date()] },
                                            '$$this.checkInDateTime',
                                        ],
                                    },
                                ],
                            },
                        },
                    },
                },
            },
        },
        {
            $lookup: {
                from: 'users',
                localField: '_id.userId',
                foreignField: '_id',
                as: 'user',
            },
        },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        {
            $match: {
                ...(filter.fullName && { 'user.fullName': { $regex: filter.fullName, $options: 'i' } }),
            },
        },
    ];
    if (options.sortBy && options.sortOrder) {
        searchAggregaates.push({
            $sort: { [options.sortBy]: options.sortOrder },
        });
    }

    const pagzingAggregaates = [{ $skip: (page - 1) * limit }, { $limit: limit }];

    // Lấy dữ liệu phân trang
    const scheduleGroups = await SchedulePreventiveTaskAssignUserModel.aggregate([
        ...searchAggregaates,
        ...pagzingAggregaates,
    ]);

    // Đếm tổng số kết quả
    const countAggregaates = [{ $count: 'totalResults' }];
    const totalResultsArr = await SchedulePreventiveTaskAssignUserModel.aggregate([
        ...searchAggregaates,
        ...countAggregaates,
    ]);
    const totalResults = totalResultsArr[0]?.totalResults || 0;
    const totalPages = Math.ceil(totalResults / limit) || 0;
    return {
        allTotalStatusScheduleAssignUser,
        scheduleGroups,
        page,
        limit,
        totalPages,
        totalResults,
    };
};
const getDetailsReportEngineerPerformanceInSchedulePreventive = async (startDate, endDate, options, filter, req) => {
    const filterMatch = {};
    // kiểm tra xem có được xem tất cả tài sản không
    let allowViewAll = true;
    if (req.companySetting.filterByAccount) {
        const dep = await Department.findById(req.user.department).select('allowViewAll');
        allowViewAll = dep?.allowViewAll;
    }
    const amQuery = {};
    if (filter.branchs && Array.isArray(filter.branchs) && filter.branchs.length > 0) {
        amQuery.branch = { $in: filter.branchs.map(id => Types.ObjectId(id)) };
    }
    if (!allowViewAll) {
        amQuery.department = Types.ObjectId(req?.user?.department);
    }

    if (Object.keys(amQuery).length > 0) {
        const validAssetMaintenances = await AssetMaintenance.find(amQuery).select('_id');
        const amIds = validAssetMaintenances.map(asset => asset._id);
        filterMatch.assetMaintenance = { $in: amIds };
    }

    const allTotalStatusScheduleAssignUser = await getAllSchedulePrevenTaskAssignUserStatus(startDate, endDate, filter, filterMatch);
    const limit = Number(options.limit) || 10;
    const page = Number(options.page) || 1;
    let userIds = [];
    if (filter.fullName) {
        const users = await User.find({
            fullName: { $regex: filter.fullName, $options: 'i' }
        }).select('_id');
        userIds = users.map(c => c._id);
    }
    const searchAggregaates = [
        {
            $lookup: {
                from: 'schedulepreventives',
                localField: 'schedulePreventive',
                foreignField: '_id',
                as: 'schedulePreventive',
            },
        },
        { $unwind: '$schedulePreventive' },
        {
            $match: {
                'schedulePreventive.startDate': { $gte: new Date(startDate), $lte: new Date(endDate) },
                isCancel: false,
                ...(filter.fullName && { user: { $in: userIds } }),
                ...(filter.code && { 'schedulePreventive.code': { $regex: filter.code, $options: 'i' } }),
                ...(filter.status && { status: filter.status }),
                ...(filterMatch.assetMaintenance && { 'schedulePreventive.assetMaintenance': filterMatch.assetMaintenance }),
            },
        },
    ];
    if (options.sortBy && options.sortOrder) {
        searchAggregaates.push({
            $sort: { [options.sortBy]: options.sortOrder },
        });
    }
    const pagzingAggregaates = [
        {
            $skip: (page - 1) * limit,
        },
        {
            $limit: limit,
        },
    ];
    let schedulePreventiveTaskAssignUsers = await SchedulePreventiveTaskAssignUserModel.aggregate([
        ...searchAggregaates,
        ...pagzingAggregaates,
    ]);
    schedulePreventiveTaskAssignUsers = await SchedulePreventiveTaskAssignUserModel.populate(
        schedulePreventiveTaskAssignUsers,
        [{ path: 'schedulePreventive', populate: { path: 'preventive' } }, { path: 'user' }]
    );

    const countAggregaates = [
        {
            $count: 'totalResults',
        },
    ];
    const totalResults = await SchedulePreventiveTaskAssignUserModel.aggregate([...searchAggregaates, ...countAggregaates]);
    return {
        allTotalStatusScheduleAssignUser,
        schedulePreventiveTaskAssignUsers,
        totalResults: totalResults[0],
    };
};
module.exports = {
    getTotalParameterSchedulePreventive,
    getDetailsProcecssingSattusSchedulePreventive,
    getSumaryProcecssingSattusSchedulePreventive,
    getAllSchedulePrevenTaskAssignUserStatus,
    getSummaryReportEngineerPerformanceInSchedulePreventive,
    getDetailsReportEngineerPerformanceInSchedulePreventive,
};
