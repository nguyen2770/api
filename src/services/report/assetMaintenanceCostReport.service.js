const { AmcModel } = require("../../models");

const getReport = async (filter, options) => {
    const page = parseInt(options.page) || 1;
    const limit = parseInt(options.limit) || 10;
    const sortBy = options.sortBy || 'createdAt';
    const sortOrder = options.sortOrder || 'desc';
    const sortStage = {};
    sortStage[sortBy] = sortOrder === 'asc' ? 1 : -1;
    const skip = (page - 1) * limit;

    const matchStage = {
        // ...(filter.startDate &&
        //     filter.endDate && {
        //     effectiveDate: {
        //         $gte: new Date(filter.startDate),
        //         $lte: new Date(filter.endDate),
        //     },
        // }),
        ...(filter.startDate && { effectiveDate: { $gte: new Date(filter.startDate) } }),
        ...(filter.endDate && { effectiveDate: { $lte: new Date(filter.endDate) } }),
    };

    const aggregate = [
        {
            $match: matchStage,
        },
        {
            $lookup: {
                from: 'servicecontractors',
                localField: 'serviceContractor',
                foreignField: '_id',
                as: 'serviceContractor',
            },
        },
        { $unwind: { path: '$serviceContractor', preserveNullAndEmptyArrays: true } },
        {
            $lookup: {
                from: 'amcserviceschemas',
                localField: '_id',
                foreignField: 'amc',
                pipeline: [
                    {
                        $lookup: {
                            from: 'amcservicetaskschemas',
                            localField: '_id',
                            foreignField: 'amcService',
                            as: 'amcServiceTasks',
                        },
                    },
                ],
                as: 'amcService',
            },
        },
        {
            $lookup: {
                from: 'schedulepreventives',
                localField: '_id',
                foreignField: 'amc',
                as: 'schedules'
            }
        },
        {
            $lookup: {
                from: 'schedulepreventivetasks',
                localField: 'schedules._id',
                foreignField: 'schedulePreventive',
                as: 'tasks'
            }
        },
        {
            $lookup: {
                from: "breakdowns",
                let: { taskIds: "$tasks._id" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $in: ["$schedulePreventiveTask", "$$taskIds"]
                            }
                        }
                    }
                ],
                as: "breakdowns"
            }
        },
        {
            $addFields: {
                amcService: {
                    $map: {
                        input: "$amcService",
                        as: "service",
                        in: {
                            $mergeObjects: [
                                "$$service",
                                {
                                    serviceTotalTaskPrice: { $sum: { $ifNull: ["$$service.amcServiceTasks.totalPrice", []] } },
                                    serviceValue: {
                                        $multiply: [
                                            { $sum: "$$service.amcServiceTasks.totalPrice" },
                                            { $ifNull: ["$$service.noOfAsset", 0] },
                                            { $ifNull: ["$$service.frequencyNumber", 0] }
                                        ]
                                    }
                                }
                            ]
                        }
                    }
                }
            }
        },
        {
            $addFields: {
                totalContractValue: { $sum: { $ifNull: ["$amcService.serviceValue", []] } }
            }
        },
        { $sort: sortStage },
        {
            $project: {
                _id: 1,
                amcNo: 1,
                serviceContractor: {
                    _id: 1,
                    serviceContractorName: 1,
                },
                // effectiveDate: { $ifNull: ['$effectiveDate', '$signedDate'] },
                effectiveDate: '$effectiveDate',
                // end date ???
                amcCost: '$totalContractValue',
                noOfAsset: { $sum: '$amcService.noOfAsset' },
                maintenanceCount: { $size: '$schedules' },
                breakdownCount: { $size: '$breakdowns' },
                completedSCCount: {
                    $size: {
                        $filter: {
                            input: "$schedules",
                            as: "schedule",
                            cond: {
                                $in: ["$$schedule.status", ["completed", "waitingForAdminApproval"]]
                            }
                        }
                    }
                },
            }
        },
    ];

    const countAggregates = [...aggregate,
    {
        $group: {
            _id: null,
            totalCount: { $sum: 1 },
            totalCost: { $sum: '$amcCost' },
            // totalAsset: { $sum: '$noOfAsset' },
            totalSchedulePreventive: { $sum: '$maintenanceCount' },
            totalBreakdown: { $sum: '$breakdownCount' },
            scCompleted: { $sum: '$completedSCCount' }
        }
    }
    ];
    const fullAggregates = [...aggregate, { $skip: skip }, { $limit: limit }];
    const [amcs, countAmcs] = await Promise.all([
        AmcModel.aggregate(fullAggregates),
        AmcModel.aggregate(countAggregates)
    ]);
    const totalResults = countAmcs.length > 0 ? countAmcs[0].totalCount : 0;
    const totalPages = Math.ceil(totalResults / limit);

    return {
        amcs,
        page: page,
        limit: limit,
        totalPages: totalPages,
        totalResults: totalResults,
        parameter: {
            // totalAsset: countAmcs[0].totalAsset,
            totalCost: countAmcs[0].totalCost,
            totalSchedulePreventive: countAmcs[0].totalSchedulePreventive,
            totalBreakdown: countAmcs[0].totalBreakdown,
            totalSchedulePreventiveCompleted: countAmcs[0].scCompleted,
        }
    };
};

module.exports = {
    getReport,
}