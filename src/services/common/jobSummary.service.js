const { Types } = require('mongoose');
const { OriginModel, Breakdown, SchedulePreventiveModel, Department, AssetMaintenance } = require('../../models');
const { jobSummarieType } = require('../../utils/constant');

const getJobSummary = async (filter, options, req) => {
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
    const page = Number(options.page) || 1;
    const limit = Number(options.limit) || 10;
    const startDate = filter.startDate ? new Date(filter.startDate) : new Date('1970-01-01');
    const endDate = filter.endDate ? new Date(filter.endDate) : new Date('2999-12-31');
    if (filter.jobType === jobSummarieType.ALL) {
        filter.jobType = {
            $in: [jobSummarieType.BREAKDOWN, jobSummarieType.CALIBRATION_WORK, jobSummarieType.SCHEDULE_PREVENTIVE],
        };
    }
    const results = await Breakdown.aggregate([
        { $match: filterMatch },
        {
            $project: {
                jobType: { $literal: jobSummarieType.BREAKDOWN },
                code: '$code',
                status: '$status',
                createdAt: '$createdAt',
                assetMaintenance: '$assetMaintenance',
            },
        },
        {
            $lookup: {
                from: 'assetmaintenanceisnotactivehistories',
                localField: '_id',
                foreignField: 'origin',
                as: 'history'
            }
        },
        {
            $unwind: { path: '$history', preserveNullAndEmptyArrays: true }
        },
        {
            $addFields: {
                workingTime: {
                    $cond: {
                        if: { $not: ["$history"] },
                        then: { time: 0, startDate: null, endDate: null },
                        else: {
                            time: {
                                $cond: {
                                    if: "$history.endDate",
                                    then: "$history.time",
                                    else: { $subtract: [new Date(), "$history.startDate"] }
                                }
                            },
                            startDate: "$history.startDate",
                            endDate: { $ifNull: ["$history.endDate", new Date()] }
                        }
                    }
                }
            }
        },
        {
            $unionWith: {
                coll: 'calibrationworks',
                pipeline: [
                    { $match: filterMatch },
                    {
                        $project: {
                            jobType: { $literal: jobSummarieType.CALIBRATION_WORK },
                            code: '$code',
                            status: '$status',
                            // createdAt: 1,
                            startDate: '$startDate',
                            assetMaintenance: '$assetMaintenance',
                            calibrationName: '$calibrationName',
                        },
                    },
                ],
            },
        },
        {
            $unionWith: {
                coll: 'schedulepreventives',
                pipeline: [
                    { $match: filterMatch },
                    {
                        $project: {
                            jobType: { $literal: jobSummarieType.SCHEDULE_PREVENTIVE },
                            code: '$code',
                            status: '$status',
                            // createdAt: 1,
                            startDate: '$startDate',
                            preventiveName: '$preventiveName',
                            assetMaintenance: '$assetMaintenance',
                            scheduleType: '$scheduleType',
                            amc: '$amc',
                            ticketStatus: '$ticketStatus',
                        },
                    },
                ],
            },
        },

        {
            $lookup: {
                from: 'assetmaintenances',
                let: { amId: '$assetMaintenance' },
                pipeline: [
                    { $match: { $expr: { $eq: ['$_id', '$$amId'] } } },
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
                            as: 'assetModel',
                        },
                    },
                    { $unwind: { path: '$assetModel', preserveNullAndEmptyArrays: true } },
                    {
                        $lookup: {
                            from: 'customers',
                            localField: 'customer',
                            foreignField: '_id',
                            as: 'customer',
                        },
                    },
                    { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } },
                ],
                as: 'assetMaintenance',
            },
        },
        {
            $unwind: {
                path: '$assetMaintenance',
                preserveNullAndEmptyArrays: true,
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
                from: 'calibrationcontracts',
                localField: 'calibrationContract',
                foreignField: '_id',
                as: 'calibrationContract',
            },
        },

        {
            $unwind: {
                path: '$amc',
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $unwind: {
                path: '$calibrationContract',
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $addFields: {
                filterDate: {
                    $switch: {
                        branches: [
                            {
                                case: { $eq: ['$jobType', jobSummarieType.BREAKDOWN] },
                                then: '$createdAt',
                            },
                            {
                                case: { $eq: ['$jobType', jobSummarieType.SCHEDULE_PREVENTIVE] },
                                then: '$startDate',
                            },
                            {
                                case: { $eq: ['$jobType', jobSummarieType.CALIBRATION_WORK] },
                                then: '$startDate',
                            },
                        ],
                        default: '$createdAt',
                    },
                },
            },
        },
        {
            $match: {
                filterDate: {
                    $gte: startDate,
                    $lte: endDate,
                },
                jobType: filter.jobType,
            },
        },
        {
            $facet: {
                results: [
                    { $sort: { [options.sortBy]: options.sortOrder } },
                    { $skip: (options.page - 1) * options.limit },
                    { $limit: limit },
                ],
                totalResults: [{ $count: 'count' }],
            },
        },
        {
            $addFields: {
                totalResults: { $ifNull: [{ $arrayElemAt: ['$totalResults.count', 0] }, 0] },
                page,
                limit,
                totalPages: {
                    $ceil: {
                        $divide: [{ $ifNull: [{ $arrayElemAt: ['$totalResults.count', 0] }, 0] }, limit],
                    },
                },
            },
        },
    ]);
    // console.log(startDate, endDate);
    // console.log(results[0]);
    return (
        results[0] || {
            results: [],
            totalResults: 0,
            page: 1,
            limit: 10,
            totalPages: 0,
        }
    );
};
module.exports = {
    getJobSummary,
};
