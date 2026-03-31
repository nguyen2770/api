const breakdownService = require('../common/breakdown.service');
const { Breakdown, BreakdownAssignUserCheckinCheckOutModel, BreakdownAssignUserModel, Customer, User, AssetMaintenance, Department } = require('../../models');
const {
    ticketBreakdownStatus,
    breakdownStatus,
    assetMaintenanceStatus,
    reportView,
    breakdownAssignUserStatus,
} = require('../../utils/constant');
const { Types } = require('mongoose');

const getActivityReportBreakdown = async (startDate, endDate, filter, req) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

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

    const detailQuery = {
        createdAt: { $gte: start, $lte: end },
        ...(filter.priorityLevel && { priorityLevel: filter.priorityLevel }),
        ...(filter.status && { status: filter.status }),
        ...(filter.code && { code: { $regex: filter.code, $options: 'i' } }),
        ...(filter.customerName && { customer: { $in: customerIds } }),
        ...filterMatch,
    };

    const [counts] = await Breakdown.aggregate([
        {
            $match: detailQuery // { createdAt: { $gte: start, $lte: end } },
        },
        {
            $group: {
                _id: null,
                totalBreakdownNews: {
                    $sum: { $cond: [{ $eq: ['$ticketStatus', ticketBreakdownStatus.new] }, 1, 0] },
                },
                totalBreakdownInProgress: {
                    $sum: { $cond: [{ $eq: ['$ticketStatus', ticketBreakdownStatus.inProgress] }, 1, 0] },
                },
                totalBreakdownOverdues: {
                    $sum: {
                        $cond: [
                            {
                                $and: [
                                    {
                                        $in: [
                                            '$ticketStatus',
                                            [ticketBreakdownStatus.new, ticketBreakdownStatus.inProgress],
                                        ],
                                    },
                                    { $lt: ['$incidentDeadline', new Date()] },
                                ],
                            },
                            1,
                            0,
                        ],
                    },
                },
                totalBreakdownCompleted: {
                    $sum: { $cond: [{ $eq: ['$ticketStatus', ticketBreakdownStatus.completed] }, 1, 0] },
                },
                totalBreakdownClosed: {
                    $sum: {
                        $cond: [
                            {
                                $and: [
                                    { $eq: ['$ticketStatus', ticketBreakdownStatus.cloesed] },
                                    { $eq: ['$status', breakdownStatus.cloesed] },
                                ],
                            },
                            1,
                            0,
                        ],
                    },
                },
                totalBreakdownCancelled: {
                    $sum: {
                        $cond: [
                            {
                                $and: [
                                    { $eq: ['$ticketStatus', ticketBreakdownStatus.cloesed] },
                                    { $eq: ['$status', breakdownStatus.cancelled] },
                                ],
                            },
                            1,
                            0,
                        ],
                    },
                },
                totalBreakdownIsNotActives: {
                    $sum: { $cond: [{ $eq: ['$assetMaintenanceStatus', assetMaintenanceStatus.isNotActive] }, 1, 0] },
                },
                totalBreakdownIsActives: {
                    $sum: { $cond: [{ $eq: ['$assetMaintenanceStatus', assetMaintenanceStatus.isActive] }, 1, 0] },
                },
                totalAllBreakdowns: { $sum: 1 },
                totalDownTimeBreakdown: { $sum: '$downTimeMilis' }, // nếu đã lưu sẵn downtime
            },
        },
    ]);

    // Nếu vẫn cần downtime tính bằng workingTimeBreakdown:
    const activeBreakdowns = await Breakdown.find({
        // createdAt: { $gte: start, $lte: end },
        ...detailQuery,
        // status: { $ne: breakdownStatus.cancelled },
    }).select('_id');
    const totalDownTimeBreakdown = await breakdownService.workingTimeBreakdowns(activeBreakdowns.map((b) => b._id));

    return {
        ...counts,
        totalDownTimeBreakdown,
    };
};

const getListBreakdownActivity = async (startDate, endDate, options, _reportView, filter, req) => {
    const limit = Number(options.limit) || 10;
    const page = Number(options.page) || 1;
    const start = new Date(startDate);
    const end = new Date(endDate);

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

    if (_reportView === reportView.summary) {
        let basePipeline = []
        // const basePipeline = [
        //     {
        //         $match: {
        //             createdAt: { $gte: start, $lte: end },
        //             ...(filter.priorityLevel && { priorityLevel: filter.priorityLevel }),
        //             // ...(filter.status && { status: filter.status }),
        //             // ...(filter.code && { code: { $regex: filter.code, $options: 'i' } }),
        //         },
        //     },
        //     {
        //         $group: {
        //             _id: {
        //                 customer: '$customer',
        //                 priorityLevel: '$priorityLevel',
        //             },
        //             breakdownIds: { $push: '$_id' },
        //             total: { $sum: 1 },
        //             totalDownTimeMilis: { $sum: '$downTimeMilis' },
        //         },
        //     },
        //     {
        //         $lookup: {
        //             from: 'customers',
        //             localField: '_id.customer',
        //             foreignField: '_id',
        //             as: 'customer',
        //         },
        //     },
        //     { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } },
        // ];

        if (filter.filterBy === "customer") {
            basePipeline = [
                {
                    $match: {
                        createdAt: { $gte: start, $lte: end },
                        ...(filter.priorityLevel && { priorityLevel: filter.priorityLevel }),
                        // ...(filter.status && { status: filter.status }),
                        // ...(filter.code && { code: { $regex: filter.code, $options: 'i' } }),
                        ...filterMatch,
                    },
                },
                {
                    $group: {
                        _id: {
                            customer: { $ifNull: ['$customer', null] },
                            priorityLevel: { $ifNull: ['$priorityLevel', null] },
                        },
                        breakdownIds: { $push: '$_id' },
                        total: { $sum: 1 },
                        totalDownTimeMilis: { $sum: '$downTimeMilis' },
                    },
                },
                {
                    $lookup: {
                        from: 'customers',
                        localField: '_id.customer',
                        foreignField: '_id',
                        as: 'customer',
                    },
                },
                { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } },
            ];

        } else if (filter.filterBy === "assetMaintenance") {
            basePipeline = [
                {
                    $match: {
                        createdAt: { $gte: start, $lte: end },
                        // ...(filter.priorityLevel && { priorityLevel: filter.priorityLevel }),
                        // ...(filter.status && { status: filter.status }),
                        // ...(filter.code && { code: { $regex: filter.code, $options: 'i' } }),
                        ...filterMatch,
                    },
                },
                {
                    $group: {
                        _id: {
                            assetMaintenance: { $ifNull: ['$assetMaintenance', null] },
                            priorityLevel: { $ifNull: ['$priorityLeveli', null] },
                        },
                        breakdownIds: { $push: '$_id' },
                        total: { $sum: 1 },
                        totalDownTimeMilis: { $sum: '$downTimeMilis' },
                        customer: { $addToSet: '$customer' },
                    },
                },
                {
                    $lookup: {
                        from: 'assetmaintenances',
                        localField: '_id.assetMaintenance',
                        foreignField: '_id',
                        as: 'assetMaintenance',
                    },
                },
                { $unwind: { path: '$assetMaintenance', preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: 'customers',
                        localField: 'customer',
                        foreignField: '_id',
                        as: 'customer',
                    },
                },
                { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } },
            ];
        }

        if (filter.customerName) {
            basePipeline.push({
                $match: {
                    "customer.customerName": { $regex: filter.customerName, $options: "i" }
                }
            });
        }

        if (options.sortBy && options.sortOrder) {
            basePipeline.push({ $sort: { [options.sortBy]: options.sortOrder } });
        }

        const [groups, totalResultsArr] = await Promise.all([
            Breakdown.aggregate([...basePipeline, { $skip: (page - 1) * limit }, { $limit: limit }]),
            Breakdown.aggregate([...basePipeline, { $count: 'totalResults' }]),
        ]);

        const totalResults = totalResultsArr[0]?.totalResults || 0;
        const totalPages = Math.ceil(totalResults / limit);

        // Tính downtime động song song
        await Promise.all(
            groups.map(async (group) => {
                // const times = await Promise.all(
                //     group.breakdownIds.map(id => breakdownService.workingTimeBreakdown(id))
                // );
                // group.downtime = times.reduce((s, t) => s + t.time, 0);
                group.downtime = await breakdownService.workingTimeBreakdowns(group.breakdownIds.map((id) => id));
            })
        );
        return { results: groups, page, limit, totalPages, totalResults };
    }

    // Chi tiết
    const detailQuery = {
        createdAt: { $gte: start, $lte: end },
        ...(filter.priorityLevel && { priorityLevel: filter.priorityLevel }),
        ...(filter.status && { status: filter.status }),
        ...(filter.code && { code: { $regex: filter.code, $options: 'i' } }),
        ...filterMatch,
    };
    if (filter.customerName) {
        // tìm ID khách hàng trước để gán vào query
        const customerIds = await Customer.find({
            customerName: { $regex: filter.customerName, $options: 'i' }
        }).distinct('_id');
        detailQuery.customer = { $in: customerIds };
    }
    return Breakdown.paginate(
        // { createdAt: { $gte: start, $lte: end } },
        detailQuery,
        {
            ...options,
            populate: [
                { path: 'customer' }, { path: 'createdBy' },
                { path: 'assetMaintenance' }
            ]
        }
    );
};

const getAllBreakdownAssignUserStatus = async (startDate, endDate, filterMatch) => {
    const totalBreakdownAssignUsers = await BreakdownAssignUserModel.countDocuments({
        createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
        ...filterMatch,
    });
    const totalBreakdownAssignUserStatusNews = await BreakdownAssignUserModel.countDocuments({
        createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
        status: {
            $in: [breakdownAssignUserStatus.reopen, breakdownAssignUserStatus.assigned, breakdownAssignUserStatus.accepted],
        },
        ...filterMatch,
    });
    const totalBreakdownAssignUserStatusInProgress = await BreakdownAssignUserModel.countDocuments({
        createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
        status: {
            $in: [
                breakdownAssignUserStatus.inProgress,
                breakdownAssignUserStatus.requestForSupport,
                breakdownAssignUserStatus.WCA,
                breakdownAssignUserStatus.reassignment,
                breakdownAssignUserStatus.experimentalFix,
                breakdownAssignUserStatus.pendingApproval,
                breakdownAssignUserStatus.approved,
                breakdownAssignUserStatus.submitted,
            ],
        },
        ...filterMatch,
    });
    const totalBreakdownAssignUserStatusRejecteds = await BreakdownAssignUserModel.countDocuments({
        createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
        status: breakdownAssignUserStatus.rejected,
        ...filterMatch,
    });
    const totalBreakdownAssignUserStatusCompleteds = await BreakdownAssignUserModel.countDocuments({
        createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
        status: breakdownAssignUserStatus.completed,
        ...filterMatch,
    });
    const totalBreakdownAssignUserStatusCloseds = await BreakdownAssignUserModel.countDocuments({
        createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
        status: {
            $in: [
                breakdownAssignUserStatus.cloesed,
                breakdownAssignUserStatus.cancelled,
                breakdownAssignUserStatus.replacement,
            ],
        },
        ...filterMatch,
    });
    const listBreakdownTotalTimeConsumed = await BreakdownAssignUserModel.aggregate([
        {
            $match: {
                createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
                status: { $nin: [breakdownAssignUserStatus.cancelled] },
                ...filterMatch,
            },
        },
    ]);
    const totalConsumed = await BreakdownAssignUserCheckinCheckOutModel.aggregate([
        {
            $match: { breakdownAssignUser: { $in: listBreakdownTotalTimeConsumed.map((b) => b._id) } },
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
    const totalConsumedMs = totalConsumed.length > 0 ? totalConsumed[0].totalConsumed : 0;
    return {
        totalBreakdownAssignUsers,
        totalBreakdownAssignUserStatusNews,
        totalBreakdownAssignUserStatusInProgress,
        totalBreakdownAssignUserStatusRejecteds,
        totalBreakdownAssignUserStatusCompleteds,
        totalBreakdownAssignUserStatusCloseds,
        totalConsumedMs,
    };
};
const getSummaryReportEngineerPerformanceInBreakdown = async (startDate, endDate, options, filter, req) => {
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
        const validBreakdowns = await Breakdown.find({ assetMaintenance: { $in: amIds } });
        const breakdownIds = validBreakdowns.map(b => b._id);
        filterMatch.breakdown = { $in: breakdownIds };
    }

    const allBreakdownAssignUserStatus = await getAllBreakdownAssignUserStatus(startDate, endDate, filterMatch);
    const limit = Number(options.limit) || 10;
    const page = Number(options.page) || 1;

    const searchAggregates = [
        {
            $match: {
                createdAt: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate),
                },
                ...filterMatch,
            },
        },
    ];
    let userIds = [];
    if (filter.fullName) {
        const users = await User.find({
            fullName: { $regex: filter.fullName, $options: 'i' }
        }).select('_id');
        userIds = users.map(u => u._id);
        searchAggregates.push({
            $match: { user: { $in: userIds }, }
        });
    }

    if (options.sortBy && options.sortOrder) {
        searchAggregates.push({
            $sort: { [options.sortBy]: options.sortOrder },
        });
    }

    const pagingAggregates = [{ $skip: (page - 1) * limit }, { $limit: limit }];

    const breakdownAssignUsers = await BreakdownAssignUserModel.aggregate([
        ...searchAggregates,
        {
            $group: {
                _id: '$user',
                assignUserIds: { $push: '$_id' }, // lưu danh sách BreakdownAssignUserId để join tính thời gian
                totalBreakdowns: { $sum: 1 },
                newCount: {
                    $sum: {
                        $cond: [
                            {
                                $in: [
                                    '$status',
                                    [breakdownStatus.reopen, breakdownStatus.assigned, breakdownStatus.accepted],
                                ],
                            },
                            1,
                            0,
                        ],
                    },
                },
                inProgressCount: {
                    $sum: {
                        $cond: [
                            {
                                $in: [
                                    '$status',
                                    [
                                        breakdownStatus.inProgress,
                                        breakdownStatus.requestForSupport,
                                        breakdownStatus.WCA,
                                        breakdownStatus.reassignment,
                                        breakdownStatus.experimentalFix,
                                        breakdownStatus.pendingApproval,
                                        breakdownStatus.approved,
                                        breakdownStatus.submitted,
                                    ],
                                ],
                            },
                            1,
                            0,
                        ],
                    },
                },
                rejectedCount: {
                    $sum: {
                        $cond: [{ $in: ['$status', [breakdownStatus.rejected]] }, 1, 0],
                    },
                },
                completedCount: {
                    $sum: {
                        $cond: [{ $in: ['$status', [breakdownStatus.WWA]] }, 1, 0],
                    },
                },
                closedCount: {
                    $sum: {
                        $cond: [{ $in: ['$status', [breakdownStatus.cloesed, breakdownStatus.cancelled]] }, 1, 0],
                    },
                },
            },
        },
        {
            $lookup: {
                from: 'breakdownassignusercheckincheckouts', // bảng log checkin/checkout
                let: { assignUserIds: '$assignUserIds' },
                pipeline: [
                    { $match: { $expr: { $in: ['$breakdownAssignUser', '$$assignUserIds'] } } },
                    {
                        $group: {
                            _id: null,
                            totalUsageTime: {
                                $sum: {
                                    $subtract: [{ $ifNull: ['$logOutAt', new Date()] }, '$logInAt'],
                                },
                            },
                        },
                    },
                ],
                as: 'usageData',
            },
        },
        {
            $addFields: {
                totalUsageTime: {
                    $ifNull: [{ $arrayElemAt: ['$usageData.totalUsageTime', 0] }, 0],
                },
            },
        },
        {
            $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'user',
            },
        },
        { $unwind: '$user' },
        { $project: { usageData: 0, assignUserIds: 0 } }, // dọn dữ liệu phụ
        ...pagingAggregates,
    ]);

    const totalResults = await BreakdownAssignUserModel.aggregate([
        ...searchAggregates,
        { $group: { _id: '$user' } },
        { $count: 'totalResults' },
    ]);
    // const count = totalResults.length > 0 ? totalResults[0].count : 0;
    return {
        allBreakdownAssignUserStatus,
        breakdownAssignUsers,
        totalResults: totalResults[0],
    };
};

const getDetailsReportEngineerPerformanceInBreakdown = async (startDate, endDate, options, filter, req) => {
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
        const validBreakdowns = await Breakdown.find({ assetMaintenance: { $in: amIds } });
        const breakdownIds = validBreakdowns.map(b => b._id);
        filterMatch.breakdown = { $in: breakdownIds };
    }

    const allBreakdownAssignUserStatus = await getAllBreakdownAssignUserStatus(startDate, endDate, filterMatch);
    const limit = Number(options.limit) || 10;
    const page = Number(options.page) || 1;

    const searchAggregaates = [
        {
            $match: {
                createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
                // ...(filter.code && { code: { $regex: filter.code, $options: 'i' } }),
                ...(filter.status && { status: filter.status }),
                ...filterMatch,
            },
        },
    ];
    let userIds = [];
    if (filter.fullName) {
        const users = await User.find({
            fullName: { $regex: filter.fullName, $options: 'i' }
        }).select('_id');
        userIds = users.map(u => u._id);
        searchAggregaates.push({
            $match: { user: { $in: userIds }, }
        });
    }
    let breakdownIds = [];
    if (filter.code) {
        const breakdowns = await Breakdown.find({
            code: { $regex: filter.code, $options: 'i' }
        }).select('_id');
        breakdownIds = breakdowns.map(u => u._id);
        searchAggregaates.push({
            $match: { breakdown: { $in: breakdownIds }, }
        });
    }
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
    let breakdownAssignUsers = await BreakdownAssignUserModel.aggregate([...searchAggregaates, ...pagzingAggregaates]);
    breakdownAssignUsers = await BreakdownAssignUserModel.populate(breakdownAssignUsers, [
        { path: 'breakdown', populate: { path: 'createdBy' } },
        { path: 'user' },
    ]);

    const countAggregaates = [
        {
            $count: 'totalResults',
        },
    ];
    const totalResults = await BreakdownAssignUserModel.aggregate([...searchAggregaates, ...countAggregaates]);
    return {
        allBreakdownAssignUserStatus,
        breakdownAssignUsers,
        totalResults: totalResults[0],
    };
};
module.exports = {
    getActivityReportBreakdown,
    getListBreakdownActivity,
    getSummaryReportEngineerPerformanceInBreakdown,
    getAllBreakdownAssignUserStatus,
    getDetailsReportEngineerPerformanceInBreakdown,
};
