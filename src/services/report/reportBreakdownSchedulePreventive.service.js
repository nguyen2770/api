const { Types } = require('mongoose');
const { Breakdown, SchedulePreventiveModel, CalibrationWorkModel, Department, AssetMaintenance } = require('../../models');
const { jobSummarieType } = require('../../utils/constant');
const getReportAssetMaintenanceRequest = async (startDate, endDate, options = {}, filter = {}, req) => {
    const { limit = 10, page = 1, sortOrder = 'desc' } = options;

    const order = sortOrder === 'asc' ? 1 : -1;
    const { type } = filter;

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

    const queryFilter = {
        createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
        ...(filter.code && { code: { $regex: filter.code, $options: 'i' } }),
        ...(filter.status && { status: filter.status }),
        ...(filter.priority && { priorityLevel: filter.priority }),
    };
    const queryFilterSchedulePreventive = {
        startDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
        ...(filter.code && { code: { $regex: filter.code, $options: 'i' } }),
        ...(filter.status && { status: filter.status }),
        ...(filter.priority && { priorityLevel: filter.priority }),
    };
    const queryFilterCalibrationWork = {
        startDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
        ...(filter.code && { code: { $regex: filter.code, $options: 'i' } }),
        ...(filter.status && { status: filter.status }),
        ...(filter.priority && { priorityLevel: filter.priority }),
    };
    const aggregaates = [
        { $match: filterMatch },
        {
            $lookup: {
                from: 'assetmaintenances',
                localField: 'assetMaintenance',
                foreignField: '_id',
                as: 'assetMaintenance',
            },
        },
        { $unwind: '$assetMaintenance' },
        {
            $lookup: {
                from: 'assetmodels',
                localField: 'assetMaintenance.assetModel',
                foreignField: '_id',
                as: 'assetMaintenance.assetModel',
            },
        },
        { $unwind: { path: '$assetMaintenance.assetModel', preserveNullAndEmptyArrays: true } },
        {
            $lookup: {
                from: 'assets',
                localField: 'assetMaintenance.assetModel.asset',
                foreignField: '_id',
                as: 'assetMaintenance.assetModel.asset',
            },
        },
        { $unwind: { path: '$assetMaintenance.assetModel.asset', preserveNullAndEmptyArrays: true } },
    ];

    const [breakdowns, schedulePreventives, calibrationWorks] = await Promise.all([
        !type || type === jobSummarieType.BREAKDOWN
            ? Breakdown.aggregate([{ $match: queryFilter }, ...aggregaates, { $sort: { createdAt: order } }])
            : [],
        !type || type === jobSummarieType.SCHEDULE_PREVENTIVE
            ? SchedulePreventiveModel.aggregate([
                { $match: queryFilterSchedulePreventive },
                {
                    $lookup: {
                        from: 'preventives',
                        localField: 'preventive',
                        foreignField: '_id',
                        as: 'preventive',
                    },
                },
                ...aggregaates,
                { $unwind: { path: '$preventive', preserveNullAndEmptyArrays: true } },
                { $sort: { startDate: order } },
            ])
            : [],
        !type || type === jobSummarieType.CALIBRATION_WORK
            ? CalibrationWorkModel.aggregate([
                { $match: queryFilterCalibrationWork },
                {
                    $lookup: {
                        from: 'calibrationworks',
                        localField: 'calibrationwork',
                        foreignField: '_id',
                        as: 'calibrationwork',
                    },
                },
                ...aggregaates,
                { $unwind: { path: '$calibrationwork', preserveNullAndEmptyArrays: true } },
                { $sort: { startDate: order } },
            ])
            : [],
    ]);

    let allRequests = [
        ...breakdowns.map((i) => ({ ...i, type: jobSummarieType.BREAKDOWN })),
        ...schedulePreventives.map((i) => ({ ...i, type: jobSummarieType.SCHEDULE_PREVENTIVE })),
        ...calibrationWorks.map((i) => ({ ...i, type: jobSummarieType.CALIBRATION_WORK })),
    ];
    allRequests.sort((a, b, c) => {
        const dateA = a.type === jobSummarieType.BREAKDOWN ? new Date(a.createdAt) : new Date(a.startDate);

        const dateB = b.type === jobSummarieType.BREAKDOWN ? new Date(b.createdAt) : new Date(b.startDate);

        return sortOrder === 1 ? dateA - dateB : dateB - dateA;
    });

    if (filter.preventiveName) {
        const regex = new RegExp(filter.preventiveName, 'i');
        allRequests = allRequests.filter((i) => i?.preventive?.preventiveName && regex.test(i.preventive.preventiveName));
    }

    const totalResults = allRequests.length;
    const countByType = (t) => allRequests.filter((i) => i.type === t).length;

    return {
        data: allRequests.slice((page - 1) * limit, page * limit),
        totalResults,
        currentPage: page,
        totalPages: Math.ceil(totalResults / limit),
        totalBreakdown: countByType(jobSummarieType.BREAKDOWN),
        totalSchedulePreventive: countByType(jobSummarieType.SCHEDULE_PREVENTIVE),
        totalCalibrationWork: countByType(jobSummarieType.CALIBRATION_WORK),
    };
};

module.exports = {
    getReportAssetMaintenanceRequest,
};
