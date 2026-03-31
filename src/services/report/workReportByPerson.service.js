const { calibrationWorkService } = require("..");
const { BreakdownAttachmentModel, BreakdownAssignUserAttachmentModel, CalibrationAttachmentModel, SchedulePreventiveTaskItemModel, Department, AssetMaintenance, Breakdown, SchedulePreventiveModel, CalibrationWorkModel } = require("../../models");
const BreakdownAssignUser = require("../../models/common/breakdownAssignUser.model");
const { breakdownAssignUserStatus, calibrationWorkAssignUserStatus, schedulePreventiveTaskAssignUserStatus, jobSummarieType } = require("../../utils/constant");
const mongoose = require('mongoose')

const validBreakdownStatus = [
    breakdownAssignUserStatus.completed, breakdownAssignUserStatus.cloesed,
    breakdownAssignUserStatus.inProgress, breakdownAssignUserStatus.accepted,
    breakdownAssignUserStatus.requestForSupport, breakdownAssignUserStatus.WCA,
    breakdownAssignUserStatus.reassignment, breakdownAssignUserStatus.experimentalFix,
    breakdownAssignUserStatus.pending_approval, breakdownAssignUserStatus.approved,
    breakdownAssignUserStatus.submitted
];

const validCalibrationStatus = [
    calibrationWorkAssignUserStatus.completed,
    calibrationWorkAssignUserStatus.inProgress,
    calibrationWorkAssignUserStatus.accepted,
    calibrationWorkAssignUserStatus.partiallyCompleted,
    calibrationWorkAssignUserStatus.completeRecalibrationIssue
];

const validScheduleStatus = [
    schedulePreventiveTaskAssignUserStatus.completed,
    schedulePreventiveTaskAssignUserStatus.inProgress,
    schedulePreventiveTaskAssignUserStatus.partiallyCompleted,
    schedulePreventiveTaskAssignUserStatus.pendingApproval,
    schedulePreventiveTaskAssignUserStatus.submitted,
    schedulePreventiveTaskAssignUserStatus.reopen,
    schedulePreventiveTaskAssignUserStatus.reassignment,
    schedulePreventiveTaskAssignUserStatus.accepted
];

const getWorkReportByPerson = async (filter, options, req) => {
    const page = parseInt(options.page) || 1;
    const limit = parseInt(options.limit) || 10;
    const sortBy = options.sortBy || 'userName';
    const sortOrder = options.sortOrder || 'asc';
    const sortStage = {};
    sortStage[sortBy] = sortOrder === 'desc' ? -1 : 1;
    const skip = (page - 1) * limit;

    const now = new Date();
    const defaultStartDate = new Date();
    defaultStartDate.setDate(now.getDate() - 7);
    defaultStartDate.setHours(0, 0, 0, 0);
    const defaultEndDate = new Date();
    defaultEndDate.setHours(23, 59, 59, 999);
    const startDate = filter.startDate ? new Date(filter.startDate) : defaultStartDate;
    const endDate = filter.endDate ? new Date(filter.endDate) : defaultEndDate;

    let filterMatch = {};
    // kiểm tra xem có được xem tất cả tài sản không
    let allowViewAll = true;
    if (req.companySetting.filterByAccount) {
        const dep = await Department.findById(req.user.department).select('allowViewAll');
        allowViewAll = dep?.allowViewAll;
    }
    const amQuery = {};
    if (filter.branchs && Array.isArray(filter.branchs) && filter.branchs.length > 0) {
        amQuery.branch = { $in: filter.branchs.map(id => mongoose.Types.ObjectId(id)) };
        delete filter.branchs;
    }
    if (!allowViewAll) {
        amQuery.department = mongoose.Types.ObjectId(req?.user?.department);
    }

    if (Object.keys(amQuery).length > 0) {
        const validAssetMaintenances = await AssetMaintenance.find(amQuery).select('_id');
        const amIds = validAssetMaintenances.map(asset => asset._id);

        const [validBreakdowns, validSchedules, validCalibrations] = await Promise.all([
            Breakdown.find({ assetMaintenance: { $in: amIds } }).select('_id'),
            SchedulePreventiveModel.find({ assetMaintenance: { $in: amIds } }).select('_id'),
            CalibrationWorkModel.find({ assetMaintenance: { $in: amIds } }).select('_id')
        ]);

        const breakdownIds = validBreakdowns.map(b => b._id);
        const scheduleIds = validSchedules.map(s => s._id);
        const calibrationWorkIds = validCalibrations.map(c => c._id);

        filterMatch = {
            $or: [
                { breakdown: { $in: breakdownIds } },
                { schedulePreventive: { $in: scheduleIds } },
                { calibrationWork: { $in: calibrationWorkIds } },
            ]
        };
    }

    const aggregate = [
        {
            $match: {
                createdAt: {
                    $gte: startDate,
                    $lte: endDate
                },
                status: { $in: validBreakdownStatus },
                ...filterMatch,
            }
        },
        { $addFields: { taskType: 'BREAKDOWN' } },
        {
            $lookup: {
                from: 'breakdowns',
                localField: 'breakdown',
                foreignField: '_id',
                as: 'deadlineInfo',
            }
        },
        { $unwind: '$deadlineInfo' },
        {
            $unionWith: {
                coll: 'calibrationworkassignusers',
                pipeline: [
                    {
                        $match: {
                            createdAt: { $gte: startDate, $lte: endDate },
                            status: { $in: validCalibrationStatus },
                            ...filterMatch,
                        }
                    },
                    { $addFields: { taskType: 'CALIBRATION_WORK' } },
                    {
                        $lookup: {
                            from: 'calibrationworks',
                            localField: 'calibrationWork',
                            foreignField: '_id',
                            as: 'deadlineInfo',
                        }
                    },
                    { $unwind: '$deadlineInfo' }
                ]
            }
        },
        {
            $unionWith: {
                coll: 'schedulepreventivetaskassignusers',
                pipeline: [
                    {
                        $match: {
                            createdAt: { $gte: startDate, $lte: endDate },
                            status: { $in: validScheduleStatus },
                            ...filterMatch,
                        }
                    },
                    { $addFields: { taskType: 'SCHEDULE_PREVENTIVE' } },
                    {
                        $lookup: {
                            from: 'schedulepreventivetasks',
                            localField: 'schedulePreventiveTask',
                            foreignField: '_id',
                            as: 'deadlineInfo',
                        }
                    },
                    { $unwind: '$deadlineInfo' }
                ]
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'user',
                foreignField: '_id',
                as: 'userInfo',
            }
        },
        { $unwind: '$userInfo' },
        {
            $match: {
                ...(filter.userName && { 'userInfo.fullName': { $regex: filter.userName, $options: 'i' } }),
            }
        },
        {
            $group: {
                _id: '$user',
                userName: { $first: '$userInfo.fullName' },
                completedOnTimeIds: {
                    $push: {
                        $cond: [{
                            $and: [
                                {
                                    $or: [
                                        { $and: [{ $eq: ['$taskType', 'BREAKDOWN'] }, { $in: ['$status', [breakdownAssignUserStatus.completed, breakdownAssignUserStatus.cloesed]] }] },
                                        { $and: [{ $eq: ['$taskType', 'CALIBRATION_WORK'] }, { $in: ['$status', [calibrationWorkAssignUserStatus.completed]] }] },
                                        { $and: [{ $eq: ['$taskType', 'SCHEDULE_PREVENTIVE'] }, { $in: ['$status', [schedulePreventiveTaskAssignUserStatus.completed]] }] },
                                    ]
                                },
                                {
                                    $or: [
                                        { $eq: [{ $ifNull: ['$deadlineInfo.incidentDeadline', null] }, null] }, // Nếu không có deadline
                                        { $lte: ['$completedDate', '$deadlineInfo.incidentDeadline'] }         // Hoặc làm xong trước deadline
                                    ]
                                },
                            ]
                        }, { id: '$_id', type: '$taskType' }, '$$REMOVE'] // push nếu thỏa mãn, nếu không thì loại bỏ
                    }
                },
                completedLateIds: {
                    $push: {
                        $cond: [{
                            $and: [
                                {
                                    $or: [
                                        { $and: [{ $eq: ['$taskType', 'BREAKDOWN'] }, { $in: ['$status', [breakdownAssignUserStatus.completed, breakdownAssignUserStatus.cloesed]] }] },
                                        { $and: [{ $eq: ['$taskType', 'CALIBRATION_WORK'] }, { $in: ['$status', [calibrationWorkAssignUserStatus.completed]] }] },
                                        { $and: [{ $eq: ['$taskType', 'SCHEDULE_PREVENTIVE'] }, { $in: ['$status', [schedulePreventiveTaskAssignUserStatus.completed]] }] },
                                    ]
                                },
                                { $ne: [{ $ifNull: ['$deadlineInfo.incidentDeadline', null] }, null] },
                                { $gt: ['$completedDate', '$deadlineInfo.incidentDeadline'] }
                            ]
                        }, { id: '$_id', type: '$taskType' }, '$$REMOVE']
                    }
                },
                onScheduleIds: {
                    $push: {
                        $cond: [
                            {
                                $and: [
                                    {
                                        $or: [
                                            {
                                                $and: [
                                                    {
                                                        $eq: ['$taskType', 'BREAKDOWN']
                                                    },
                                                    {
                                                        $in: ['$status', [
                                                            breakdownAssignUserStatus.inProgress,
                                                            breakdownAssignUserStatus.accepted,
                                                            breakdownAssignUserStatus.requestForSupport,
                                                            breakdownAssignUserStatus.WCA,
                                                            breakdownAssignUserStatus.reassignment,
                                                            breakdownAssignUserStatus.experimentalFix,
                                                            breakdownAssignUserStatus.pending_approval,
                                                            breakdownAssignUserStatus.approved,
                                                            breakdownAssignUserStatus.submitted,
                                                        ]]
                                                    }
                                                ]
                                            },
                                            {
                                                $and: [
                                                    {
                                                        $eq: ['$taskType', 'CALIBRATION_WORK']
                                                    },
                                                    {
                                                        $in: ['$status', [
                                                            calibrationWorkAssignUserStatus.inProgress,
                                                            calibrationWorkAssignUserStatus.accepted,
                                                            calibrationWorkAssignUserStatus.partiallyCompleted,
                                                            calibrationWorkAssignUserStatus.completeRecalibrationIssue,
                                                        ]]
                                                    }
                                                ]
                                            },
                                            {
                                                $and: [
                                                    {
                                                        $eq: ['$taskType', 'SCHEDULE_PREVENTIVE']
                                                    },
                                                    {
                                                        $in: ['$status', [
                                                            schedulePreventiveTaskAssignUserStatus.inProgress,
                                                            schedulePreventiveTaskAssignUserStatus.partiallyCompleted,
                                                            schedulePreventiveTaskAssignUserStatus.pendingApproval,
                                                            schedulePreventiveTaskAssignUserStatus.submitted,
                                                            schedulePreventiveTaskAssignUserStatus.reopen,
                                                            schedulePreventiveTaskAssignUserStatus.reassignment,
                                                            schedulePreventiveTaskAssignUserStatus.accepted,
                                                        ]]
                                                    }
                                                ]
                                            },
                                        ]
                                    },
                                    {
                                        $or: [
                                            { $eq: [{ $ifNull: ['$deadlineInfo.incidentDeadline', null] }, null] }, // Nếu không có deadline -> đúng hạn
                                            { $lte: [now, '$deadlineInfo.incidentDeadline'] }                      // Hoặc chưa tới deadline
                                        ],
                                    },
                                ]
                            }, { id: '$_id', type: '$taskType' }, '$$REMOVE'
                        ]
                    }
                },
                currentlyBehindScheduleIds: {
                    $push: {
                        $cond: [
                            {
                                $and: [
                                    {
                                        $or: [
                                            {
                                                $and: [
                                                    {
                                                        $eq: ['$taskType', 'BREAKDOWN']
                                                    },
                                                    {
                                                        $in: ['$status', [
                                                            breakdownAssignUserStatus.inProgress,
                                                            breakdownAssignUserStatus.accepted,
                                                            breakdownAssignUserStatus.requestForSupport,
                                                            breakdownAssignUserStatus.WCA,
                                                            breakdownAssignUserStatus.reassignment,
                                                            breakdownAssignUserStatus.experimentalFix,
                                                            breakdownAssignUserStatus.pending_approval,
                                                            breakdownAssignUserStatus.approved,
                                                            breakdownAssignUserStatus.submitted,
                                                        ]]
                                                    }
                                                ]
                                            },
                                            {
                                                $and: [
                                                    {
                                                        $eq: ['$taskType', 'CALIBRATION_WORK']
                                                    },
                                                    {
                                                        $in: ['$status', [
                                                            calibrationWorkAssignUserStatus.inProgress,
                                                            calibrationWorkAssignUserStatus.accepted,
                                                            calibrationWorkAssignUserStatus.partiallyCompleted,
                                                            calibrationWorkAssignUserStatus.completeRecalibrationIssue,
                                                        ]]
                                                    }
                                                ]
                                            },
                                            {
                                                $and: [
                                                    {
                                                        $eq: ['$taskType', 'SCHEDULE_PREVENTIVE']
                                                    },
                                                    {
                                                        $in: ['$status', [
                                                            schedulePreventiveTaskAssignUserStatus.inProgress,
                                                            schedulePreventiveTaskAssignUserStatus.partiallyCompleted,
                                                            schedulePreventiveTaskAssignUserStatus.pendingApproval,
                                                            schedulePreventiveTaskAssignUserStatus.submitted,
                                                            schedulePreventiveTaskAssignUserStatus.reopen,
                                                            schedulePreventiveTaskAssignUserStatus.reassignment,
                                                            schedulePreventiveTaskAssignUserStatus.accepted,
                                                        ]]
                                                    }
                                                ]
                                            },
                                        ]
                                    },
                                    { $ne: [{ $ifNull: ['$deadlineInfo.incidentDeadline', null] }, null] },
                                    { $gt: [now, '$deadlineInfo.incidentDeadline'] },
                                ]
                            }, { id: '$_id', type: '$taskType' }, '$$REMOVE'
                        ]
                    }
                },
            }
        },
        {
            $addFields: {
                completedOnTime: { $size: '$completedOnTimeIds' },
                completedLate: { $size: '$completedLateIds' },
                onSchedule: { $size: '$onScheduleIds' },
                currentlyBehindSchedule: { $size: '$currentlyBehindScheduleIds' },
                totalJobs: {
                    $sum: [
                        { $size: '$completedOnTimeIds' },
                        { $size: '$completedLateIds' },
                        { $size: '$onScheduleIds' },
                        { $size: '$currentlyBehindScheduleIds' },
                    ]
                }
            }
        },
        { $sort: sortStage },
    ];

    const countAggregates = [
        ...aggregate,
        { $count: 'totalCount' }
    ];
    const fullAggregates = [
        ...aggregate,
        { $skip: skip },
        { $limit: limit },
    ];

    const [reports, countReports] = await Promise.all([
        BreakdownAssignUser.aggregate(fullAggregates),
        BreakdownAssignUser.aggregate(countAggregates),
    ]);

    const totalResults = countReports.length > 0 ? countReports[0].totalCount : 0;
    const totalPages = Math.ceil(totalResults / limit);
    return {
        reports: reports,
        page: page,
        limit: limit,
        totalPages: totalPages,
        totalResults: totalResults,
    };
}
const getListWorkReportByPerson = async (filter, options) => {
    const page = parseInt(options.page) || 1;
    const limit = parseInt(options.limit) || 10;
    const sortBy = options.sortBy || 'code';
    const sortOrder = options.sortOrder || 'asc';
    const sortStage = {};
    sortStage[sortBy] = sortOrder === 'desc' ? -1 : 1;
    const skip = (page - 1) * limit;

    const now = new Date();
    const defaultStartDate = new Date();
    defaultStartDate.setDate(now.getDate() - 7);
    defaultStartDate.setHours(0, 0, 0, 0);
    const defaultEndDate = new Date();
    defaultEndDate.setHours(23, 59, 59, 999);
    const startDate = filter.startDate ? new Date(filter.startDate) : defaultStartDate;
    const endDate = filter.endDate ? new Date(filter.endDate) : defaultEndDate;

    const workList = filter.workList || [];
    const idsByType = workList.reduce((acc, item) => {
        if (!acc[item.type]) acc[item.type] = [];
        acc[item.type].push(new mongoose.Types.ObjectId(item.id));
        return acc;
    }, {});

    if (filter.jobType === jobSummarieType.ALL) {
        filter.jobType = {
            $in: [jobSummarieType.BREAKDOWN, jobSummarieType.CALIBRATION_WORK, jobSummarieType.SCHEDULE_PREVENTIVE],
        };
    }

    const pipelineAM = {
        $lookup: {
            from: 'assetmaintenances',
            let: { amId: '$assetMaintenance' },
            pipeline: [
                {
                    $match: {
                        $expr: { $eq: ['$_id', '$$amId'] },
                    }
                },
                {
                    $lookup: {
                        from: 'assets',
                        localField: 'asset',
                        foreignField: '_id',
                        as: 'asset',
                    },
                },
                { $unwind: { path: '$asset', preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: 'assetmodels',
                        localField: 'assetModel',
                        foreignField: '_id',
                        pipeline: [
                            {
                                $lookup: {
                                    from: 'manufacturers',
                                    localField: 'manufacturer',
                                    foreignField: '_id',
                                    as: 'manufacturer',
                                },
                            },
                            { $unwind: { path: '$manufacturer', preserveNullAndEmptyArrays: true } },
                            {
                                $lookup: {
                                    from: 'categories',
                                    localField: 'category',
                                    foreignField: '_id',
                                    as: 'category',
                                },
                            },
                            { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
                            {
                                $lookup: {
                                    from: 'subcategories',
                                    localField: 'subCategory',
                                    foreignField: '_id',
                                    as: 'subCategory',
                                },
                            },
                            { $unwind: { path: '$subCategory', preserveNullAndEmptyArrays: true } },
                            {
                                $lookup: {
                                    from: 'suppliers',
                                    localField: 'supplier',
                                    foreignField: '_id',
                                    as: 'supplier',
                                },
                            },
                            { $unwind: { path: '$supplier', preserveNullAndEmptyArrays: true } },
                            {
                                $lookup: {
                                    from: 'assettypecategories',
                                    localField: 'assetTypeCategory',
                                    foreignField: '_id',
                                    as: 'assetTypeCategory',
                                },
                            },
                            { $unwind: { path: '$assetTypeCategory', preserveNullAndEmptyArrays: true } },
                        ],
                        as: 'assetModel',
                    },
                },
                { $unwind: { path: '$assetModel', preserveNullAndEmptyArrays: true } },
            ],
            as: 'assetMaintenance'
        }
    }

    const aggregate = [
        {
            $match: { _id: { $in: idsByType['BREAKDOWN'] || [] } }
        },
        {
            $lookup: {
                from: 'breakdowns',
                let: { breakdownId: '$breakdown' },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ['$_id', '$$breakdownId'] },
                            ...(filter.code && { code: { $regex: filter.code, $options: 'i' } }),
                        }
                    },
                    {
                        ...pipelineAM,
                    },
                    { $unwind: { path: '$assetMaintenance', preserveNullAndEmptyArrays: true } },
                    {
                        $lookup: {
                            from: 'servicecategories',
                            localField: 'serviceCategory',
                            foreignField: '_id',
                            as: 'serviceCategory',
                        },
                    },
                    { $unwind: { path: '$serviceCategory', preserveNullAndEmptyArrays: true } },
                    // {
                    //     $lookup: {
                    //         from: 'subservicecategories',
                    //         localField: 'subServiceCategory',
                    //         foreignField: '_id',
                    //         as: 'subServiceCategory',
                    //     },
                    // },
                    // { $unwind: { path: '$subServiceCategory', preserveNullAndEmptyArrays: true } },
                ],
                as: 'breakdown',
            }
        },
        { $unwind: '$breakdown' },
        { $addFields: { jobType: 'BREAKDOWN' } },
        {
            $unionWith: {
                coll: 'calibrationworkassignusers',
                pipeline: [
                    { $match: { _id: { $in: idsByType['CALIBRATION_WORK'] || [] } } },
                    {
                        $lookup: {
                            from: 'calibrationworks',
                            let: { cwId: '$calibrationWork' },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: { $eq: ['$_id', '$$cwId'] },
                                        ...(filter.code && { code: { $regex: filter.code, $options: 'i' } }),
                                    }
                                },
                                {
                                    ...pipelineAM,
                                },
                                { $unwind: { path: '$assetMaintenance', preserveNullAndEmptyArrays: true } },
                            ],
                            as: 'calibrationWork'
                        }
                    },
                    { $unwind: '$calibrationWork' },
                    { $addFields: { jobType: 'CALIBRATION_WORK' } },
                ],
            }
        },
        {
            $unionWith: {
                coll: 'schedulepreventivetaskassignusers',
                pipeline: [
                    { $match: { _id: { $in: idsByType['SCHEDULE_PREVENTIVE'] || [] } } },
                    {
                        $lookup: {
                            from: 'schedulepreventivetasks',
                            let: { sptId: '$schedulePreventiveTask' },
                            pipeline: [
                                { $match: { $expr: { $eq: ['$_id', '$$sptId'] } } },
                                {
                                    $lookup: {
                                        from: 'schedulepreventives',
                                        let: { spId: '$schedulePreventive' },
                                        pipeline: [
                                            {
                                                $match: {
                                                    $expr: { $eq: ['$_id', '$$spId'] },
                                                    ...(filter.code && { code: { $regex: filter.code, $options: 'i' } }),
                                                }
                                            },
                                            {
                                                ...pipelineAM,
                                            },
                                            { $unwind: { path: '$assetMaintenance', preserveNullAndEmptyArrays: true } },
                                        ],
                                        as: 'schedulePreventive',
                                    }
                                },
                                { $unwind: '$schedulePreventive' },
                            ],
                            as: 'schedulePreventiveTask'
                        }
                    },
                    { $unwind: '$schedulePreventiveTask' },
                    { $addFields: { jobType: 'SCHEDULE_PREVENTIVE' } }
                ]
            }
        },
        {
            $match: {
                ...(filter.assetName ? {
                    $or: [
                        { 'breakdown.assetMaintenance.assetName': { $regex: filter.assetName, $options: 'i' } },
                        { 'calibrationWork.assetMaintenance.assetName': { $regex: filter.assetName, $options: 'i' } },
                        { 'schedulePreventiveTask.schedulePreventive.assetMaintenance.assetName': { $regex: filter.assetName, $options: 'i' } }
                    ],
                } : {}),
                ...(filter.status ? {
                    $or: [
                        { 'breakdown.status': filter.status },
                        { 'calibrationWork.status': filter.status },
                        { status: filter.status },
                        { 'schedulePreventiveTask.schedulePreventive.status': filter.status }
                    ]
                } : {}),
                jobType: filter.jobType,
            }
        },
        { $sort: sortStage }
    ];
    const countAggregates = [
        ...aggregate,
        { $count: 'totalCount' }
    ];
    const fullAggregates = [
        ...aggregate,
        { $skip: skip },
        { $limit: limit },
    ];

    const [reports, countReports] = await Promise.all([
        BreakdownAssignUser.aggregate(fullAggregates),
        BreakdownAssignUser.aggregate(countAggregates),
    ]);

    const totalResults = countReports.length > 0 ? countReports[0].totalCount : 0;
    const totalPages = Math.ceil(totalResults / limit);

    return {
        reports: reports,
        page: page,
        limit: limit,
        totalPages: totalPages,
        totalResults: totalResults,
    };
}
const getResource = async (filter) => {
    let listDocuments = [];
    if (filter.jobType === jobSummarieType.BREAKDOWN && filter.id) {
        listDocuments = getDataByBreakdown(filter.id);
    } else if (filter.jobType === jobSummarieType.CALIBRATION_WORK && filter.id) {
        listDocuments = getDataByCalibrationWorkAssignUser(filter.id);
    } else if (filter.jobType === jobSummarieType.SCHEDULE_PREVENTIVE && filter.id) {
        listDocuments = getDataBySchedulePreventiveTaskItem(filter.id);
    }
    return listDocuments;
}
const getDataBySchedulePreventiveTaskItem = async (schedulePreventiveTaskId) => {
    const listDocuments = await SchedulePreventiveTaskItemModel.find({
        schedulePreventiveTask: schedulePreventiveTaskId,
        resource: { $ne: null }
    })
        .populate({ path: 'resource' })
        .sort({ createdAt: 1 });
    return listDocuments || [];
};
const getDataByCalibrationWorkAssignUser = async (calibrationWorkAssignUserId) => {
    const listDocuments = await CalibrationAttachmentModel.find({
        calibrationWorkAssignUser: calibrationWorkAssignUserId,
    })
        .populate({ path: 'resource' })
        .sort({ createdAt: 1 });
    return listDocuments || [];
};
const getDataByBreakdown = async (breakdownAssignUserId) => {
    const listDocuments = await BreakdownAssignUserAttachmentModel.find({
        breakdownAssignUser: breakdownAssignUserId,
    })
        .populate([
            { path: 'resource' },
        ])
        .sort({ createdAt: 1 });
    return listDocuments || [];
};
module.exports = {
    getWorkReportByPerson,
    getListWorkReportByPerson,
    getResource,
}