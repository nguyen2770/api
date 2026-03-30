const breakdownService = require('../common/breakdown.service');
const { AssetMaintenance, Customer, Department } = require('../../models');
const { assetMaintenanceService } = require('..');
const { Types } = require('mongoose');

const getSummaryReportAssetPerformance = async (startDate, endDate, options, filter, req) => {
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
        filterMatch._id = { $in: amIds };
    }

    let customerIds = [];
    if (filter.customerName) {
        const customers = await Customer.find({
            customerName: { $regex: filter.customerName, $options: 'i' }
        }).select('_id');
        customerIds = customers.map(c => c._id);
    }
    const searchAggregaates = [
        {
            $match: {
                customer: {
                    $ne: null,
                    ...(filter.customerName && { $in: customerIds })
                },
                ...filterMatch,
            },
        },
        {
            $addFields: {
                totalHoursAvailable: {
                    $divide: [
                        {
                            $subtract: [
                                new Date(endDate), // luôn đến endDate
                                {
                                    $cond: [
                                        {
                                            $and: [
                                                { $gt: ['$installationDate', new Date(startDate)] },
                                                { $lt: ['$installationDate', new Date(endDate)] },
                                                { $ne: ['$installationDate', null] },
                                            ],
                                        },
                                        '$installationDate',
                                        new Date(startDate),
                                    ],
                                },
                            ],
                        },
                        1,
                    ],
                },
            },
        },
        {
            $lookup: {
                from: 'breakdowns',
                let: { amId: '$_id' }, // biến tạm giữ AssetMaintenance._id
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$assetMaintenance', '$$amId'] },
                                    { $gte: ['$createdAt', new Date(startDate)] },
                                    { $lte: ['$createdAt', new Date(endDate)] },
                                ],
                            },
                        },
                    },
                ],
                as: 'breakdowns',
            },
        },
        {
            $lookup: {
                from: 'breakdownassignusercheckincheckouts',
                localField: 'breakdowns._id',
                foreignField: 'breakdown',
                as: 'checkins',
            },
        },
        {
            $addFields: {
                totalDowntimeCheckinCheckout: {
                    $sum: {
                        $map: {
                            input: '$checkins',
                            as: 'c',
                            in: { $subtract: ['$$c.logOutAt', '$$c.logInAt'] },
                        },
                    },
                },
            },
        },
        {
            $addFields: {
                totalBreakdowns: { $size: '$breakdowns' },
            },
        },
        {
            $group: {
                _id: '$customer',
                assetMaintenanceIds: { $push: '$_id' },
                totalAssetmaintenances: { $sum: 1 },
                totalHoursAvailable: { $sum: '$totalHoursAvailable' },
                totalDowntimeCheckinCheckout: { $sum: '$totalDowntimeCheckinCheckout' },
                totalBreakdowns: { $sum: '$totalBreakdowns' },
            },
        },
        {
            $lookup: {
                from: 'customers',
                localField: '_id', // _id lúc này chính là customerId
                foreignField: '_id',
                as: 'customer',
            },
        },
        { $unwind: '$customer' },
    ];

    if (options.sortBy && options.sortOrder) {
        searchAggregaates.push({
            $sort: { [options.sortBy]: options.sortOrder },
        });
    }

    const pagzingAggregaates = [{ $skip: (page - 1) * limit }, { $limit: limit }];

    const assetMaintenanceSummarys = await AssetMaintenance.aggregate([...searchAggregaates, ...pagzingAggregaates]);
    for (const am of assetMaintenanceSummarys) {
        let downtime = 0;
        downtime = await assetMaintenanceService.calcularDowntimeOfAssetMaintenances(
            am.assetMaintenanceIds,
            startDate,
            endDate
        );
        am.totalDowntime = downtime;
        am.totalAvailability =
            ((am.totalHoursAvailable * am.totalBreakdowns - downtime) / (am.totalHoursAvailable * am.totalBreakdowns)) * 100;
        am.totalMTTR = downtime / am.totalBreakdowns;
        am.totalMTBF = (am.totalHoursAvailable * am.totalBreakdowns - downtime) / (am.totalBreakdowns * am.totalBreakdowns);
    }
    const countAggregaates = [{ $count: 'totalResults' }];
    const totalResults = await AssetMaintenance.aggregate([...searchAggregaates, ...countAggregaates]);

    return {
        assetMaintenanceSummarys,
        totalResults: totalResults[0],
    };
};

const getDetailsReportAssetPerformance = async (startDate, endDate, options, filter, req) => {
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
        filterMatch._id = { $in: amIds };
    }

    const searchAggregaates = [
        {
            $match: filterMatch,
        },
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
        { $unwind: '$asset' },
        { $unwind: '$assetModel' },
        {
            $match: {
                customer: { $ne: null },
                ...(filter.assetName && { assetName: { $regex: filter.assetName, $options: 'i' } }),
                ...(filter.assetModelName && { assetModelName: { $regex: filter.assetModelName, $options: 'i' } }),
                ...(filter.serial && { serial: { $regex: filter.serial, $options: 'i' } }),
                ...(filter.assetNumber && { assetNumber: { $regex: filter.assetNumber, $options: 'i' } }),
            },
        },
        {
            $addFields: {
                totalHoursAvailable: {
                    $divide: [
                        {
                            $subtract: [
                                new Date(endDate), // luôn đến endDate
                                {
                                    $cond: [
                                        {
                                            $and: [
                                                { $gt: ['$installationDate', new Date(startDate)] },
                                                { $lt: ['$installationDate', new Date(endDate)] },
                                                { $ne: ['$installationDate', null] },
                                            ],
                                        },
                                        '$installationDate',
                                        new Date(startDate),
                                    ],
                                },
                            ],
                        },
                        1,
                    ],
                },
            },
        },
        {
            $lookup: {
                from: 'breakdowns',
                let: { amId: '$_id' }, // biến tạm giữ AssetMaintenance._id
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$assetMaintenance', '$$amId'] },
                                    { $gte: ['$createdAt', new Date(startDate)] },
                                    { $lte: ['$createdAt', new Date(endDate)] },
                                ],
                            },
                        },
                    },
                ],
                as: 'breakdowns',
            },
        },
        {
            $lookup: {
                from: 'breakdownassignusercheckincheckouts',
                localField: 'breakdowns._id',
                foreignField: 'breakdown',
                as: 'checkins',
            },
        },
        {
            $addFields: {
                totalDowntimeCheckinCheckout: {
                    $sum: {
                        $map: {
                            input: '$checkins',
                            as: 'c',
                            in: { $subtract: ['$$c.logOutAt', '$$c.logInAt'] },
                        },
                    },
                },
            },
        },
        {
            $addFields: {
                totalBreakdowns: { $size: '$breakdowns' },
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
    const assetMaintenances = await AssetMaintenance.aggregate([...searchAggregaates, ...pagzingAggregaates]);
    for (const am of assetMaintenances) {
        let downtime = 0;

        downtime = await assetMaintenanceService.calcularDowntimeOfAssetMaintenances(am._id, startDate, endDate);
        am.totalDowntime = downtime;
        am.totalAvailability =
            ((am.totalHoursAvailable * am.totalBreakdowns - downtime) / (am.totalHoursAvailable * am.totalBreakdowns)) * 100;
        am.totalMTTR = downtime / am.totalBreakdowns;
        am.totalMTBF = (am.totalHoursAvailable * am.totalBreakdowns - downtime) / (am.totalBreakdowns * am.totalBreakdowns);
    }
    const countAggregaates = [
        {
            $count: 'totalResults',
        },
    ];
    const totalResults = await AssetMaintenance.aggregate([...searchAggregaates, ...countAggregaates]);
    return {
        assetMaintenances,
        totalResults: totalResults[0],
    };
};
module.exports = {
    getSummaryReportAssetPerformance,
    getDetailsReportAssetPerformance,
};
