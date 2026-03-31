const { Types } = require('mongoose');
const { AssetMaintenance, Department } = require('../../models');
const moment = require('moment');

const normalizeAssetIds = (assetIds) => {
    if (!assetIds) return [];

    if (Array.isArray(assetIds)) return assetIds;

    if (typeof assetIds === "string") {
        return assetIds.split(",").filter(Boolean);
    }

    return [];
};
const getAssetDepreciationReport = async (filter, options, req) => {
    const page = parseInt(options.page) || 1;
    const limit = parseInt(options.limit) || 10;
    const { sortBy = { createdAt: -1 } } = options;
    let { assetName: search = '', serial = '', reportCutoffDate, assetIds = [] } = filter;

    if (search === "undefined") search = '';
    if (serial === "undefined") serial = '';
    if (reportCutoffDate === "undefined" || reportCutoffDate === "null" || reportCutoffDate === "") {
        reportCutoffDate = null;
    }

    let REPORTING_CUTOFF_DATE;
    if (reportCutoffDate == null) {
        REPORTING_CUTOFF_DATE = moment().endOf('day').utc().toDate();
    } else {
        const m = moment(reportCutoffDate);
        REPORTING_CUTOFF_DATE = m.isValid()
            ? m.endOf('day').utc().toDate()
            : moment().endOf('day').utc().toDate();
    }

    assetIds = normalizeAssetIds(assetIds);
    const assetObjectIds = (assetIds || []).map(id => new Types.ObjectId(id));

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
    if (assetObjectIds.length > 0) {
        amQuery._id = { $in: assetObjectIds };
    }

    if (Object.keys(amQuery).length > 0) {
        const validAssetMaintenances = await AssetMaintenance.find(amQuery).select('_id');
        const amIds = validAssetMaintenances.map(asset => asset._id);
        filterMatch._id = { $in: amIds };
    }

    const skip = (page - 1) * limit;
    const baseAggregates = [
        {
            $lookup: {
                from: 'assets',
                localField: 'asset',
                foreignField: '_id',
                as: 'assetInfo',
            }
        },
        { $unwind: { path: '$assetInfo', preserveNullAndEmptyArrays: true } },
        {
            $match: filterMatch,
        },
        {
            $lookup: {
                from: 'assetdepreciations',
                localField: '_id',
                foreignField: 'assetMaintenance',
                as: 'depreciations',
            }
        },
        {
            $match: {
                'depreciations.0': { $exists: true }
            }
        },
        {
            $addFields: {
                pastDepreciation: {
                    $filter: {
                        input: '$depreciations',
                        as: 'dep',
                        cond: { $lte: ['$$dep.date', REPORTING_CUTOFF_DATE] }
                    }
                },
            }
        },
        {
            $addFields: {
                monthsUsed: { $size: '$pastDepreciation' },
                latestPastDepreciation: {
                    $arrayElemAt: [
                        { $sortArray: { input: '$pastDepreciation', sortBy: { date: -1 } } },
                        0
                    ]
                }
            }
        },
        {
            $addFields: {
                totalRecords: { $size: '$depreciations' }
            }
        },
        {
            $addFields: {
                // assetName: '$assetInfo.assetName',
                // trừ 1 tháng vì date min là ngày kết thúc kỳ khấu hao
                depreciationStartDate: {
                    $dateAdd: {
                        startDate: { $min: '$depreciations.date' },
                        unit: 'month',
                        amount: -1,
                    }
                },
                //usageTime: { $multiply: ['$assetLifespan', 12] },
                usageTime: '$totalRecords',
                remainingTime: {
                    $subtract: [
                        // { $multiply: ["$assetLifespan", 12] },
                        '$totalRecords',
                        '$monthsUsed'
                    ]
                },
                originValue: "$salvageValue",
                depreciableValue: "$salvageValue",
                // accumulatedValue: { $ifNull: ['$latestPastDepreciation.accumulatedDepreciation', 0] },
                accumulatedValue: { $sum: '$pastDepreciation.value' }
            }
        },
        {
            $sort: { createdAt: -1 }
        },
    ];

    const searchStage = search ? {
        $match: {
            $or: [
                { assetName: { $regex: search, $options: 'i' } },
            ]
        }
    } : null;

    const serialStage = serial ? {
        $match: {
            $or: [
                { serial: { $regex: serial, $options: 'i' } },
            ]
        }
    } : null;

    const countAggregates = [
        ...baseAggregates,
        ...(searchStage ? [searchStage] : []),
        ...(serialStage ? [serialStage] : []),
        {
            $count: 'totalCount'
        },
    ];

    const fullAggregates = [
        ...baseAggregates,
        ...(searchStage ? [searchStage] : []),
        ...(serialStage ? [serialStage] : []),
        {
            $sort: sortBy
        },
        { $skip: skip },
        { $limit: limit },
        {
            $project: {
                _id: 1,
                assetName: '$assetName',
                serial: '$serial',
                depreciationType: '$depreciationType',
                depreciationStartDate: 1,
                usageTime: 1,
                remainingTime: 1,
                originValue: 1,
                depreciableValue: 1,
                accumulatedValue: 1,
            }
        },
    ]

    const [reports, countReports] = await Promise.all([
        AssetMaintenance.aggregate(fullAggregates),
        AssetMaintenance.aggregate(countAggregates),
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
};


// const getDetailAssetDepreciationReport = async (filter, options) => {
//     const page = parseInt(options.page) || 1;
//     const limit = parseInt(options.limit) || 10;
//     const { sortBy = { createdAt: -1 } } = options;
//     let { assetName: search = '', serial = '', reportCutoffYear } = filter;


//     if (search === "undefined") search = '';
//     if (serial === "undefined") serial = '';
//     if (reportCutoffYear === "undefined" || reportCutoffYear === "null" || reportCutoffYear === "") {
//         reportCutoffYear = null;
//     }

//     let REPORTING_CUTOFF_DATE;
//     if (reportCutoffYear == null) {
//         REPORTING_CUTOFF_DATE = moment().endOf('day').utc().toDate();
//     } else {
//         const m = moment(reportCutoffYear);
//         REPORTING_CUTOFF_DATE = m.isValid()
//             ? m.endOf('day').utc().toDate()
//             : moment().endOf('day').utc().toDate();
//     }
//     const REPORTING_CUTOFF_YEAR = REPORTING_CUTOFF_DATE.getFullYear();

//     const skip = (page - 1) * limit;
//     const baseAggregates = [
//         {
//             $lookup: {
//                 from: 'assets',
//                 localField: 'asset',
//                 foreignField: '_id',
//                 as: 'assetInfo',
//             }
//         },
//         { $unwind: { path: '$assetInfo', preserveNullAndEmptyArrays: true } },
//         {
//             $lookup: {
//                 from: 'assetdepreciations',
//                 localField: '_id',
//                 foreignField: 'assetMaintenance',
//                 as: 'depreciations',
//             }
//         },
//         {
//             $match: {
//                 'depreciations.0': { $exists: true },
//                 'depreciations.date': { $lte: REPORTING_CUTOFF_DATE },
//                 $expr: {
//                     $in: [
//                         REPORTING_CUTOFF_YEAR,
//                         { $map: { input: '$depreciations.date', as: 'd', in: { $year: '$$d' } } }
//                     ]
//                 }
//             }
//         },
//         {
//             $addFields: {
//                 // assetName: '$assetInfo.assetName',
//                 originValue: "$salvageValue",
//             }
//         },
//         {
//             $sort: { createdAt: -1 }
//         },
//     ];

//     const monthlyDepreciationAggregates = [
//         {
//             $addFields: {
//                 yearlyDepreciations: {
//                     $filter: {
//                         input: '$depreciations',
//                         as: 'dep',
//                         cond: {
//                             $and: [
//                                 { $eq: [{ $year: '$$dep.date' }, REPORTING_CUTOFF_YEAR] },
//                                 { $lte: ['$$dep.date', REPORTING_CUTOFF_DATE] }
//                             ]
//                         }
//                     }
//                 }
//             }
//         },
//         {
//             $addFields: {
//                 depreciationByMonth: {
//                     $map: {
//                         input: '$yearlyDepreciations',
//                         as: 'dep',
//                         in: {
//                             k: { $toString: { $month: '$$dep.date' } },
//                             v: '$$dep.value'
//                         }
//                     }
//                 }
//             },
//         },
//         {
//             $addFields: {
//                 depreciationMonths: {
//                     $arrayToObject: '$depreciationByMonth' // Chuyển mảng key-value thành đối tượng {1: x, 2: y, ...}
//                 },
//                 totalDepreciationYear: {
//                     $sum: '$yearlyDepreciations.value'
//                 }
//             }
//         },
//         // {
//         //     $addFields: {
//         //         monthDepreciation: {
//         //             $arrayToObject: {
//         //                 $map: {
//         //                     input: { $objectToArray: '$depreciationMonths' },
//         //                     as: 'item',
//         //                     in: {
//         //                         k: { $concat: ["month_", '$$item.k'] }, // Chuyển 1 thành month_1
//         //                         v: '$$item.v'
//         //                     }
//         //                 }
//         //             }
//         //         }
//         //     }
//         // },
//         // {
//         //     $replaceRoot: {
//         //         newRoot: { $mergeObjects: ["$$ROOT", "$monthDepreciation"] }
//         //     }
//         // },
//     ];

//     const searchStage = search ? {
//         $match: {
//             $or: [
//                 { assetName: { $regex: search, $options: 'i' } },
//             ]
//         }
//     } : null;

//     const serialStage = serial ? {
//         $match: {
//             $or: [
//                 { serial: { $regex: serial, $options: 'i' } },
//             ]
//         }
//     } : null;

//     const countAggregates = [
//         ...baseAggregates,
//         ...monthlyDepreciationAggregates,
//         ...(searchStage ? [searchStage] : []),
//         ...(serialStage ? [serialStage] : []),
//         {
//             $count: 'totalCount'
//         }
//     ];

//     const fullAggregates = [
//         ...baseAggregates,
//         ...monthlyDepreciationAggregates,
//         ...(searchStage ? [searchStage] : []),
//         ...(serialStage ? [serialStage] : []),
//         {
//             $sort: sortBy
//         },
//         { $skip: skip },
//         { $limit: limit },
//         {
//             $project: {
//                 _id: 1,
//                 assetName: '$assetName',
//                 serial: '$serial',
//                 depreciationType: '$depreciationType',
//                 originValue: 1,
//                 depreciationMonths: {
//                     month_1: '$depreciationMonths.1',
//                     month_2: '$depreciationMonths.2',
//                     month_3: '$depreciationMonths.3',
//                     month_4: '$depreciationMonths.4',
//                     month_5: '$depreciationMonths.5',
//                     month_6: '$depreciationMonths.6',
//                     month_7: '$depreciationMonths.7',
//                     month_8: '$depreciationMonths.8',
//                     month_9: '$depreciationMonths.9',
//                     month_10: '$depreciationMonths.10',
//                     month_11: '$depreciationMonths.11',
//                     month_12: '$depreciationMonths.12',
//                     total: '$totalDepreciationYear',
//                 },
//                 // depreciationMonths: {
//                 //     month_1: '$monthDepreciation.month_1',
//                 //     month_2: '$monthDepreciation.month_2',
//                 //     month_3: '$monthDepreciation.month_3',
//                 //     month_4: '$monthDepreciation.month_4',
//                 //     month_5: '$monthDepreciation.month_5',
//                 //     month_6: '$monthDepreciation.month_6',
//                 //     month_7: '$monthDepreciation.month_7',
//                 //     month_8: '$monthDepreciation.month_8',
//                 //     month_9: '$monthDepreciation.month_9',
//                 //     month_10: '$monthDepreciation.month_10',
//                 //     month_11: '$monthDepreciation.month_11',
//                 //     month_12: '$monthDepreciation.month_12',
//                 //     total: '$totalDepreciationYear',
//                 // },
//             }
//         },
//     ]

//     const [reports, countReports] = await Promise.all([
//         AssetMaintenance.aggregate(fullAggregates),
//         AssetMaintenance.aggregate(countAggregates),
//     ]);
//     const totalResults = countReports.length > 0 ? countReports[0].totalCount : 0;
//     const totalPages = Math.ceil(totalResults / limit);

//     return {
//         reports: reports,
//         page: page,
//         limit: limit,
//         totalPages: totalPages,
//         totalResults: totalResults,
//     };
// };
const getDetailAssetDepreciationReport = async (filter, options, req) => {
    const page = parseInt(options.page) || 1;
    const limit = parseInt(options.limit) || 10;
    const { sortBy = { createdAt: -1 } } = options;
    let { assetName: search = '', serial = '', reportCutoffYear, assetIds = [] } = filter;

    if (search === 'undefined') search = '';
    if (serial === 'undefined') serial = '';
    if (!reportCutoffYear || reportCutoffYear === 'undefined' || reportCutoffYear === 'null') {
        reportCutoffYear = null;
    }

    let REPORTING_CUTOFF_DATE;
    if (reportCutoffYear == null) {
        REPORTING_CUTOFF_DATE = moment().endOf('day').utc().toDate();
    } else {
        const m = moment(reportCutoffYear);
        REPORTING_CUTOFF_DATE = m.isValid()
            ? m.endOf('year').utc().toDate()
            : moment().endOf('day').utc().toDate();
    }
    const REPORTING_CUTOFF_YEAR = REPORTING_CUTOFF_DATE.getFullYear();

    assetIds = normalizeAssetIds(assetIds);
    const assetObjectIds = (assetIds || []).map(id => new Types.ObjectId(id));

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
    if (assetObjectIds.length > 0) {
        amQuery._id = { $in: assetObjectIds };
    }

    if (Object.keys(amQuery).length > 0) {
        const validAssetMaintenances = await AssetMaintenance.find(amQuery).select('_id');
        const amIds = validAssetMaintenances.map(asset => asset._id);
        filterMatch._id = { $in: amIds };
    }

    const skip = (page - 1) * limit;
    const baseAggregates = [
        {
            $lookup: {
                from: 'assets',
                localField: 'asset',
                foreignField: '_id',
                as: 'assetInfo',
            },
        },
        { $unwind: { path: '$assetInfo', preserveNullAndEmptyArrays: true } },
        {
            $match: filterMatch,
        },
        {
            $lookup: {
                from: 'assetdepreciations',
                localField: '_id',
                foreignField: 'assetMaintenance',
                as: 'depreciations',
            },
        },
        {
            $match: {
                'depreciations.0': { $exists: true },
            },
        },
        {
            $addFields: {
                originValue: '$salvageValue',
            },
        },
    ];
    const monthlyDepreciationAggregates = [
        {
            $addFields: {
                yearlyDepreciations: {
                    $filter: {
                        input: '$depreciations',
                        as: 'dep',
                        cond: {
                            $and: [
                                { $eq: [{ $year: '$$dep.date' }, REPORTING_CUTOFF_YEAR] },
                                { $lte: ['$$dep.date', REPORTING_CUTOFF_DATE] },
                            ],
                        },
                    },
                },
            },
        },
        {
            $unwind: {
                path: '$yearlyDepreciations',
                // preserveNullAndEmptyArrays: true,
            },
        },
        {
            $group: {
                _id: {
                    asset: '$_id',
                    month: { $month: '$yearlyDepreciations.date' },
                },
                monthValue: { $sum: '$yearlyDepreciations.value' },
                doc: { $first: '$$ROOT' },
            },
        },
        {
            $group: {
                _id: '$_id.asset',
                depreciationByMonth: {
                    $push: {
                        k: { $toString: '$_id.month' },
                        v: '$monthValue',
                    },
                },
                totalDepreciationYear: { $sum: '$monthValue' },
                doc: { $first: '$doc' },
            },
        },
        {
            $replaceRoot: {
                newRoot: {
                    $mergeObjects: [
                        '$doc',
                        {
                            depreciationMonths: {
                                $arrayToObject: '$depreciationByMonth',
                            },
                            totalDepreciationYear: '$totalDepreciationYear',
                        },
                    ],
                },
            },
        },
    ];

    const searchStage = search
        ? {
            $match: {
                assetName: { $regex: search, $options: 'i' },
            },
        }
        : null;

    const serialStage = serial
        ? {
            $match: {
                serial: { $regex: serial, $options: 'i' },
            },
        }
        : null;

    const fullAggregates = [
        ...baseAggregates,
        ...monthlyDepreciationAggregates,
        ...(searchStage ? [searchStage] : []),
        ...(serialStage ? [serialStage] : []),
        { $sort: sortBy },
        { $skip: skip },
        { $limit: limit },
        {
            $project: {
                _id: 1,
                assetName: '$assetName',
                serial: '$serial',
                depreciationType: '$depreciationType',
                originValue: 1,
                depreciationMonths: {
                    month_1: '$depreciationMonths.1',
                    month_2: '$depreciationMonths.2',
                    month_3: '$depreciationMonths.3',
                    month_4: '$depreciationMonths.4',
                    month_5: '$depreciationMonths.5',
                    month_6: '$depreciationMonths.6',
                    month_7: '$depreciationMonths.7',
                    month_8: '$depreciationMonths.8',
                    month_9: '$depreciationMonths.9',
                    month_10: '$depreciationMonths.10',
                    month_11: '$depreciationMonths.11',
                    month_12: '$depreciationMonths.12',
                    total: '$totalDepreciationYear',
                },
            },
        },
    ];

    const countAggregates = [
        ...baseAggregates,
        ...monthlyDepreciationAggregates,
        ...(searchStage ? [searchStage] : []),
        ...(serialStage ? [serialStage] : []),
        { $count: 'totalCount' },
    ];

    const [reports, countReports] = await Promise.all([
        AssetMaintenance.aggregate(fullAggregates),
        AssetMaintenance.aggregate(countAggregates),
    ]);

    const totalResults = countReports.length ? countReports[0].totalCount : 0;
    const totalPages = Math.ceil(totalResults / limit);

    return {
        reports,
        page,
        limit,
        totalPages,
        totalResults,
    };
};


module.exports = {
    getAssetDepreciationReport,
    getDetailAssetDepreciationReport,
}