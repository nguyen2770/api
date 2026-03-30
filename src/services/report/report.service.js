const httpStatus = require('http-status');
const breakdownService = require('../common/breakdown.service');
const crypto = require('crypto');
const {
    Breakdown,
    SchedulePreventiveModel,
    AssetMaintenance,
    SchedulePreventiveTaskAssignUserModel,
    Customer,
    BreakdownSpareRequest,
    BreakdownSpareRequestDetail,
    BreakdownAssignUserCheckinCheckOutModel,
    BreakdownAssignUserModel,
    ProvinceModel,
    CommuneModel,
    CalibrationAssignUserModel,
    CalibrationWorkAssignUserModel,
    CalibrationWorkModel,
    SchedulePrevetiveTaskSparePartRequestModel,
    SchedulePrevetiveTaskSparePartRequestDetailModel,
    Department,
} = require('../../models');
const {
    ticketBreakdownStatus,
    schedulePreventiveStatus,
    ticketSchedulePreventiveStatus,
    breakdownSpareRequestDetailStatus,
    breakdownStatus,
    breakdownAssignUserStatus,
    schedulePreventiveTaskAssignUserStatus,
    calibrationWorkAssignUserStatus,
    calibrationWorkGroupStatus,
    calibrationWorkStatus,
    schedulePreventiveTaskRequestSparePartDetailStatus,
} = require('../../utils/constant');
const ApiError = require('../../utils/ApiError');
const SchedulePreventive = require('../../models/preventive/schedulePreventive.model');
const { schedulePreventiveService, assetMaintenanceService } = require('..');
const SchedulePreventiveTask = require('../../models/preventive/schedulePreventiveTask.model');
const PreventiveTask = require('../../models/preventive/preventiveTask.model');
const Preventive = require('../../models/preventive/preventive.model');
const { schedulePreventiveTaskAssignUser } = require('../preventive/schedulePreventive.service');

const dateRangeTypeValue = {
    day: 'day',
    week: 'week',
    month: 'month',
    year: 'year',
};
const keyIndicators = {
    oneMonth: 'oneMonth',
    threeMonth: 'threeMonth',
    sixMonth: 'sixMonth',
};
const addDays = function (date, days) {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() + days);
    return newDate;
};

const firstDayOfWeek = function (date) {
    const curr = new Date(date);
    const firstday = new Date(curr.setDate(curr.getDate() - curr.getDay()));
    return firstday;
};
const lastDayOfWeek = function (date) {
    const curr = new Date(date);
    const lastday = new Date(curr.setDate(curr.getDate() - curr.getDay() + 6));
    return lastday;
};

const addMonths = function (date, months) {
    const newDate = new Date(date);
    newDate.setMonth(date.getMonth() + months);
    return newDate;
};
const dateKyIndicatorsRangeByResquest = async (type) => {
    let dateRanges = {};
    const dateNow = new Date();

    if (type === keyIndicators.oneMonth) {
        // 1 tháng gần nhất
        dateRanges = {
            startDate: new Date(dateNow.getFullYear(), dateNow.getMonth(), 1), // ngày đầu tháng hiện tại
            endDate: new Date(dateNow.getFullYear(), dateNow.getMonth() + 1, 0, 23, 59, 59, 999),
        };
    }

    if (type === keyIndicators.threeMonth) {
        // 3 tháng gần nhất
        dateRanges = {
            startDate: new Date(dateNow.getFullYear(), dateNow.getMonth() - 2, 1), // lùi về đầu tháng cách đây 2 tháng
            endDate: new Date(dateNow.getFullYear(), dateNow.getMonth() + 1, 0, 23, 59, 59, 999),
        };
    }

    if (type === keyIndicators.sixMonth) {
        // 6 tháng gần nhất
        dateRanges = {
            startDate: new Date(dateNow.getFullYear(), dateNow.getMonth() - 5, 1), // lùi về đầu tháng cách đây 5 tháng
            endDate: new Date(dateNow.getFullYear(), dateNow.getMonth() + 1, 0, 23, 59, 59, 999),
        };
    }

    return dateRanges;
};
const dateRangeByResquests = async (dateRangeType, rangeCount = 7) => {
    const dateRanges = [];
    // LẤY MỐC CHUNG – 1 LẦN DUY NHẤT
    const now = new Date();
    /* ================= DAY ================= */
    if (dateRangeType === dateRangeTypeValue.day) {
        for (let idx = rangeCount; idx >= 0; idx--) {
            const baseDate = addDays(now, -idx);

            const startDate = new Date(baseDate);
            startDate.setHours(0, 0, 0, 0);

            const endDate = new Date(baseDate);
            endDate.setHours(23, 59, 59, 999);

            dateRanges.push({
                date: baseDate,
                startDate,
                endDate,
                sortIndex: idx,
            });
        }
    }
    /* ================= WEEK ================= */
    if (dateRangeType === dateRangeTypeValue.week) {
        for (let idx = rangeCount; idx >= 0; idx--) {
            const baseDate = addDays(now, -7 * idx);

            const startDate = firstDayOfWeek(baseDate);
            startDate.setHours(0, 0, 0, 0);

            const endDate = lastDayOfWeek(baseDate);
            endDate.setHours(23, 59, 59, 999);

            dateRanges.push({
                date: baseDate,
                startDate,
                endDate,
                sortIndex: idx,
            });
        }
    }
    /* ================= MONTH ================= */
    if (dateRangeType === dateRangeTypeValue.month) {
        // MỐC = MÙNG 1 THÁNG HIỆN TẠI
        const monthBase = new Date(now.getFullYear(), now.getMonth(), 1);

        for (let idx = rangeCount; idx >= 0; idx--) {
            const monthDate = addMonths(monthBase, -idx);

            const startDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);

            const endDate = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

            dateRanges.push({
                date: monthDate,
                startDate,
                endDate,
                sortIndex: idx,
            });
        }
    }
    /* ================= YEAR ================= */
    if (dateRangeType === dateRangeTypeValue.year) {
        const currentYear = now.getFullYear();

        for (let idx = rangeCount; idx >= 0; idx--) {
            const year = currentYear - idx;

            const startDate = new Date(year, 0, 1);
            const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

            dateRanges.push({
                date: startDate,
                startDate,
                endDate,
                sortIndex: idx,
            });
        }
    }
    return dateRanges;
};

const getBreakdownChart = async (dateRangeType, rangeCount = 7, req, filter) => {
    const filterMatch = {};
    // kiểm tra xem có được xem tất cả tài sản không
    let allowViewAll = true;
    if (req.companySetting.filterByAccount) {
        const dep = await Department.findById(req.user.department).select('allowViewAll');
        allowViewAll = dep?.allowViewAll;
    }
    const amQuery = {};
    if (filter.branchs && Array.isArray(filter.branchs) && filter.branchs.length > 0) {
        amQuery.branch = { $in: filter.branchs.map(id => mongoose.Types.ObjectId(id)) };
    }
    if (!allowViewAll) {
        amQuery.department = mongoose.Types.ObjectId(req?.user?.department);
    }

    if (Object.keys(amQuery).length > 0) {
        const validAssetMaintenances = await AssetMaintenance.find(amQuery).select('_id');
        const amIds = validAssetMaintenances.map(asset => asset._id);
        filterMatch.assetMaintenance = { $in: amIds };
    }
    const dateRanges = await dateRangeByResquests(dateRangeType, rangeCount);

    const data = await Promise.all(
        dateRanges.map(async ({ startDate, endDate, ...rest }) => {
            const baseQuery = {
                createdAt: { $gte: startDate, $lte: endDate },
                status: { $ne: breakdownStatus.cancelled },
            };

            const [totalBreakdown, totalBreakdownDone] = await Promise.all([
                Breakdown.countDocuments({
                    ...baseQuery,
                    ...filterMatch,
                }),
                Breakdown.countDocuments({
                    ...baseQuery,
                    ticketStatus: ticketBreakdownStatus.completed,
                    ...filterMatch,
                }),
            ]);

            return {
                ...rest,
                startDate,
                endDate,
                totalBreakdown,
                totalBreakdownDone,
            };
        })
    );

    return data;
};

const getSchedulePreventiveChart = async (dateRangeType, rangeCount = 7, req, filter) => {
    const filterMatch = {};
    // kiểm tra xem có được xem tất cả tài sản không
    let allowViewAll = true;
    if (req.companySetting.filterByAccount) {
        const dep = await Department.findById(req.user.department).select('allowViewAll');
        allowViewAll = dep?.allowViewAll;
    }
    const amQuery = {};
    if (filter.branchs && Array.isArray(filter.branchs) && filter.branchs.length > 0) {
        amQuery.branch = { $in: filter.branchs.map(id => mongoose.Types.ObjectId(id)) };
    }
    if (!allowViewAll) {
        amQuery.department = mongoose.Types.ObjectId(req?.user?.department);
    }

    if (Object.keys(amQuery).length > 0) {
        const validAssetMaintenances = await AssetMaintenance.find(amQuery).select('_id');
        const amIds = validAssetMaintenances.map(asset => asset._id);
        filterMatch.assetMaintenance = { $in: amIds };
    }
    const dateRanges = await dateRangeByResquests(dateRangeType, rangeCount);

    const data = await Promise.all(
        dateRanges.map(async ({ startDate, endDate, ...rest }) => {
            const baseQuery = {
                startDate: { $gte: startDate, $lte: endDate },
                status: { $ne: schedulePreventiveStatus.cancelled },
            };

            const [totalSchedulePreventive, totalSchedulePreventiveDone] = await Promise.all([
                SchedulePreventiveModel.countDocuments({
                    ...baseQuery,
                    ...filterMatch,
                }),
                SchedulePreventiveModel.countDocuments({
                    ...baseQuery,
                    status: schedulePreventiveStatus.completed,
                    ...filterMatch,
                }),
            ]);

            return {
                ...rest,
                startDate,
                endDate,
                totalSchedulePreventive,
                totalSchedulePreventiveDone,
            };
        })
    );

    return data;
};

const getCalibrationWorkChart = async (dateRangeType, rangeCount = 7, req, filter) => {
    const filterMatch = {};
    // kiểm tra xem có được xem tất cả tài sản không
    let allowViewAll = true;
    if (req.companySetting.filterByAccount) {
        const dep = await Department.findById(req.user.department).select('allowViewAll');
        allowViewAll = dep?.allowViewAll;
    }
    const amQuery = {};
    if (filter.branchs && Array.isArray(filter.branchs) && filter.branchs.length > 0) {
        amQuery.branch = { $in: filter.branchs.map(id => mongoose.Types.ObjectId(id)) };
    }
    if (!allowViewAll) {
        amQuery.department = mongoose.Types.ObjectId(req?.user?.department);
    }

    if (Object.keys(amQuery).length > 0) {
        const validAssetMaintenances = await AssetMaintenance.find(amQuery).select('_id');
        const amIds = validAssetMaintenances.map(asset => asset._id);
        filterMatch.assetMaintenance = { $in: amIds };
    }
    const dateRanges = await dateRangeByResquests(dateRangeType, rangeCount);

    const data = await Promise.all(
        dateRanges.map(async ({ startDate, endDate, ...rest }) => {
            const baseQuery = {
                startDate: { $gte: startDate, $lte: endDate },
                status: { $ne: calibrationWorkStatus.cancelled },
            };
            const [totalCalibrationWork, totalCalibrationWorkDone] = await Promise.all([
                CalibrationWorkModel.countDocuments({
                    ...baseQuery,
                    ...filterMatch,
                }),
                CalibrationWorkModel.countDocuments({
                    ...baseQuery,
                    status: calibrationWorkStatus.completed,
                    ...filterMatch,
                }),
            ]);
            return {
                ...rest,
                startDate,
                endDate,
                totalCalibrationWork,
                totalCalibrationWorkDone,
            };
        })
    );

    return data;
};

const getSchedulePreventiveCompliance = async (type, req, filter) => {
    const filterMatch = {};
    // kiểm tra xem có được xem tất cả tài sản không
    let allowViewAll = true;
    if (req.companySetting.filterByAccount) {
        const dep = await Department.findById(req.user.department).select('allowViewAll');
        allowViewAll = dep?.allowViewAll;
    }
    const amQuery = {};
    if (filter.branchs && Array.isArray(filter.branchs) && filter.branchs.length > 0) {
        amQuery.branch = { $in: filter.branchs.map(id => mongoose.Types.ObjectId(id)) };
    }
    if (!allowViewAll) {
        amQuery.department = mongoose.Types.ObjectId(req?.user?.department);
    }

    if (Object.keys(amQuery).length > 0) {
        const validAssetMaintenances = await AssetMaintenance.find(amQuery).select('_id');
        const amIds = validAssetMaintenances.map(asset => asset._id);
        filterMatch.assetMaintenance = { $in: amIds };
    }
    const { startDate, endDate } = await dateKyIndicatorsRangeByResquest(type);

    const baseQuery = {
        startDate: { $gte: startDate, $lte: endDate },
        status: { $ne: schedulePreventiveStatus.cancelled },
    };

    const [total, completed] = await Promise.all([
        SchedulePreventiveModel.countDocuments({
            ...baseQuery,
            ...filterMatch,
        }),
        SchedulePreventiveModel.countDocuments({
            ...baseQuery,
            status: schedulePreventiveStatus.completed,
            ...filterMatch,
        }),
    ]);

    return {
        percentSchedulePreventive: total ? Math.round((completed / total) * 100) : 0,
    };
};

const getBreakdownCompliance = async (type, req, filter) => {
    const filterMatch = {};
    // kiểm tra xem có được xem tất cả tài sản không
    let allowViewAll = true;
    if (req.companySetting.filterByAccount) {
        const dep = await Department.findById(req.user.department).select('allowViewAll');
        allowViewAll = dep?.allowViewAll;
    }
    const amQuery = {};
    if (filter.branchs && Array.isArray(filter.branchs) && filter.branchs.length > 0) {
        amQuery.branch = { $in: filter.branchs.map(id => mongoose.Types.ObjectId(id)) };
    }
    if (!allowViewAll) {
        amQuery.department = mongoose.Types.ObjectId(req?.user?.department);
    }

    if (Object.keys(amQuery).length > 0) {
        const validAssetMaintenances = await AssetMaintenance.find(amQuery).select('_id');
        const amIds = validAssetMaintenances.map(asset => asset._id);
        filterMatch.assetMaintenance = { $in: amIds };
    }
    const { startDate, endDate } = await dateKyIndicatorsRangeByResquest(type);

    const query = {
        createdAt: { $gte: startDate, $lte: endDate },
        status: { $ne: breakdownStatus.cancelled },
    };

    const [total, closed] = await Promise.all([
        Breakdown.countDocuments({
            ...query,
            ...filterMatch,
        }),
        Breakdown.countDocuments({
            ...query,
            ticketStatus: ticketBreakdownStatus.completed,
            ...filterMatch,
        }),
    ]);

    return {
        percentBreakdown: total ? Math.round((closed / total) * 100) : 0,
    };
};

const getUpTimeAssetMaintenance = async (type, req, filter) => {
    const filterMatch = {};
    // kiểm tra xem có được xem tất cả tài sản không
    let allowViewAll = true;
    if (req.companySetting.filterByAccount) {
        const dep = await Department.findById(req.user.department).select('allowViewAll');
        allowViewAll = dep?.allowViewAll;
    }
    if (!allowViewAll) {
        filterMatch.department = mongoose.Types.ObjectId(req?.user?.department)
    }
    if (filter.branchs && Array.isArray(filter.branchs) && filter.branchs.length > 0) {
        filterMatch.department = { $in: filter.branchs.map(id => mongoose.Types.ObjectId(id)) };
    }
    const dateRange = await dateKyIndicatorsRangeByResquest(type);
    const assetMaintenances = await AssetMaintenance.find(filterMatch);
    let uptimePercent = 0;
    if (!assetMaintenances || assetMaintenances.length === 0) {
        return uptimePercent;
    }
    const totalRangeTime = assetMaintenances.reduce(
        (sum, assetMaintenance) =>
            sum +
            (!assetMaintenance.installationDate || assetMaintenance.installationDate < dateRange.startDate
                ? dateRange.endDate - dateRange.startDate
                : dateRange.endDate - assetMaintenance.installationDate),
        0
    );
    const totalDownTime = await assetMaintenanceService.calcularDowntimeOfAssetMaintenance(
        assetMaintenances.map((data) => data._id),
        dateRange.startDate,
        dateRange.endDate
    );
    uptimePercent = ((totalRangeTime - totalDownTime) / totalRangeTime) * 100;
    return uptimePercent;
};
const getSchedulePreventiveVsAssignUser = async (type, req, filter) => {
    const filterMatch = {};
    // kiểm tra xem có được xem tất cả tài sản không
    let allowViewAll = true;
    if (req.companySetting.filterByAccount) {
        const dep = await Department.findById(req.user.department).select('allowViewAll');
        allowViewAll = dep?.allowViewAll;
    }
    const amQuery = {};
    if (filter.branchs && Array.isArray(filter.branchs) && filter.branchs.length > 0) {
        amQuery.branch = { $in: filter.branchs.map(id => mongoose.Types.ObjectId(id)) };
    }
    if (!allowViewAll) {
        amQuery.department = mongoose.Types.ObjectId(req?.user?.department);
    }

    if (Object.keys(amQuery).length > 0) {
        const validAssetMaintenances = await AssetMaintenance.find(amQuery).select('_id');
        const amIds = validAssetMaintenances.map(asset => asset._id);
        filterMatch.assetMaintenance = { $in: amIds };
    }
    const dateRange = await dateKyIndicatorsRangeByResquest(type);
    const endDateAgo = new Date(dateRange.endDate);
    endDateAgo.setDate(endDateAgo.getDate() + 2);
    const cchedulePreventiveIds = await SchedulePreventiveModel.find({
        startDate: { $gte: dateRange.startDate, $lte: endDateAgo },
        status: schedulePreventiveStatus.new,
        ...filterMatch,
    }).distinct('_id');
    // Lấy distinct các id đã assign trong nhóm này
    const assignedIds = await SchedulePreventiveTaskAssignUserModel.find({
        isCancel: false,
        schedulePreventive: { $in: cchedulePreventiveIds },
    }).distinct('schedulePreventive');
    const totalSchedulePreventive = cchedulePreventiveIds.length;
    const totalSchedulePreventiveAssignUser = assignedIds.length;

    return { totalSchedulePreventive, totalSchedulePreventiveAssignUser };
};
const getAverageResponseTimeBreakdown = async (type, req, filter) => {
    const filterMatch = {};
    // kiểm tra xem có được xem tất cả tài sản không
    let allowViewAll = true;
    if (req.companySetting.filterByAccount) {
        const dep = await Department.findById(req.user.department).select('allowViewAll');
        allowViewAll = dep?.allowViewAll;
    }
    const amQuery = {};
    if (filter.branchs && Array.isArray(filter.branchs) && filter.branchs.length > 0) {
        amQuery.branch = { $in: filter.branchs.map(id => mongoose.Types.ObjectId(id)) };
    }
    if (!allowViewAll) {
        amQuery.department = mongoose.Types.ObjectId(req?.user?.department);
    }

    if (Object.keys(amQuery).length > 0) {
        const validAssetMaintenances = await AssetMaintenance.find(amQuery).select('_id');
        const amIds = validAssetMaintenances.map(asset => asset._id);
        filterMatch.assetMaintenance = { $in: amIds };
    }
    const dateRange = await dateKyIndicatorsRangeByResquest(type);
    const breakdowns = await Breakdown.aggregate([
        {
            $match: {
                createdAt: { $gte: dateRange.startDate, $lte: dateRange.endDate },
                status: { $nin: [breakdownStatus.cancelled] },
                ...filterMatch,
            },
        },
        {
            $group: {
                _id: null,
                totalResponseTime: {
                    $sum: { $subtract: ['$responseTime', '$createdAt'] }, // ms
                },
                count: { $sum: 1 },
            },
        },
    ]);

    if (!breakdowns.length) return 0;
    const { totalResponseTime, count } = breakdowns[0];
    const avgResponseTime = totalResponseTime / count;
    return { avgResponseTime };
};
const getAverageResolutionTimeBreakdown = async (type, req, filter) => {
    const filterMatch = {};
    // kiểm tra xem có được xem tất cả tài sản không
    let allowViewAll = true;
    if (req.companySetting.filterByAccount) {
        const dep = await Department.findById(req.user.department).select('allowViewAll');
        allowViewAll = dep?.allowViewAll;
    }
    const amQuery = {};
    if (filter.branchs && Array.isArray(filter.branchs) && filter.branchs.length > 0) {
        amQuery.branch = { $in: filter.branchs.map(id => mongoose.Types.ObjectId(id)) };
    }
    if (!allowViewAll) {
        amQuery.department = mongoose.Types.ObjectId(req?.user?.department);
    }

    if (Object.keys(amQuery).length > 0) {
        const validAssetMaintenances = await AssetMaintenance.find(amQuery).select('_id');
        const amIds = validAssetMaintenances.map(asset => asset._id);
        filterMatch.assetMaintenance = { $in: amIds };
    }
    const dateRange = await dateKyIndicatorsRangeByResquest(type);
    const breakdowns = await Breakdown.aggregate([
        {
            $match: { createdAt: { $gte: dateRange.startDate, $lte: dateRange.endDate }, status: breakdownStatus.cloesed, ...filterMatch, },
        },
        {
            $group: {
                _id: null,
                totalResolutionTime: {
                    $sum: { $subtract: ['$closingDate', '$responseTime'] },
                },
                count: { $sum: 1 }, // tổng số sự cố
            },
        },
    ]);

    if (!breakdowns.length) return 0;
    const { totalResolutionTime, count } = breakdowns[0];
    const avgResolutionTime = totalResolutionTime / count;
    return { avgResolutionTime };
};
const compareTicketStatusSchedulePreventiveByCustomer = async (_customer1, _customer2, req, filter) => {
    const filterMatch = {};
    // kiểm tra xem có được xem tất cả tài sản không
    let allowViewAll = true;
    if (req.companySetting.filterByAccount) {
        const dep = await Department.findById(req.user.department).select('allowViewAll');
        allowViewAll = dep?.allowViewAll;
    }
    const amQuery = {};
    if (filter.branchs && Array.isArray(filter.branchs) && filter.branchs.length > 0) {
        amQuery.branch = { $in: filter.branchs.map(id => mongoose.Types.ObjectId(id)) };
    }
    if (!allowViewAll) {
        amQuery.department = mongoose.Types.ObjectId(req?.user?.department);
    }

    if (Object.keys(amQuery).length > 0) {
        const validAssetMaintenances = await AssetMaintenance.find(amQuery).select('_id');
        const amIds = validAssetMaintenances.map(asset => asset._id);
        filterMatch.assetMaintenance = { $in: amIds };
    }
    const customer1 = await Customer.findById(_customer1);
    if (!customer1) {
        throw new ApiError(httpStatus.NOT_FOUND, 'customer1 not found');
    }
    const customer2 = await Customer.findById(_customer2);
    if (!customer2) {
        throw new ApiError(httpStatus.NOT_FOUND, 'customer2 not found');
    }
    const endDateAgo = new Date();
    endDateAgo.setDate(endDateAgo.getDate() + 2);
    const schedulePreventiveStatusNewCustomer1 = await SchedulePreventiveModel.countDocuments({
        customer: _customer1,
        ticketStatus: ticketSchedulePreventiveStatus.new,
        startDate: { $lte: endDateAgo },
        ...filterMatch,
    });
    const schedulePreventiveStatusInProgressCustomer1 = await SchedulePreventiveModel.countDocuments({
        customer: _customer1,
        ticketStatus: ticketSchedulePreventiveStatus.inProgress,
        ...filterMatch,
    });
    const schedulePreventiveStatusOverdueCustomer1 = await SchedulePreventiveModel.countDocuments({
        customer: _customer1,
        ticketStatus: { $in: [ticketSchedulePreventiveStatus.inProgress, ticketSchedulePreventiveStatus.new] },
        $expr: {
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
        ...filterMatch,
    });

    const schedulePreventiveStatusNewCustomer2 = await SchedulePreventiveModel.countDocuments({
        customer: _customer2,
        startDate: { $lte: endDateAgo },
        ticketStatus: ticketSchedulePreventiveStatus.new,
        ...filterMatch,
    });
    const schedulePreventiveStatusInProgressCustomer2 = await SchedulePreventiveModel.countDocuments({
        customer: _customer2,
        ticketStatus: ticketSchedulePreventiveStatus.inProgress,
        ...filterMatch,
    });
    const schedulePreventiveStatusOverdueCustomer2 = await SchedulePreventiveModel.countDocuments({
        customer: _customer2,
        ticketStatus: { $in: [ticketSchedulePreventiveStatus.inProgress, schedulePreventiveStatus.new] },
        $expr: {
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
        ...filterMatch,
    });
    const customer1ScheduleData = {
        name: customer1.customerName,
        new: schedulePreventiveStatusNewCustomer1,
        inProgress: schedulePreventiveStatusInProgressCustomer1,
        overdue: schedulePreventiveStatusOverdueCustomer1,
    };
    const customer2ScheduleData = {
        name: customer2.customerName,
        new: schedulePreventiveStatusNewCustomer2,
        inProgress: schedulePreventiveStatusInProgressCustomer2,
        overdue: schedulePreventiveStatusOverdueCustomer2,
    };
    return {
        customer1ScheduleData,
        customer2ScheduleData,
    };
};
const compareTicketStatusBreakdownByCustomer = async (_customer1, _customer2, req, filter) => {
    const filterMatch = {};
    // kiểm tra xem có được xem tất cả tài sản không
    let allowViewAll = true;
    if (req.companySetting.filterByAccount) {
        const dep = await Department.findById(req.user.department).select('allowViewAll');
        allowViewAll = dep?.allowViewAll;
    }
    const amQuery = {};
    if (filter.branchs && Array.isArray(filter.branchs) && filter.branchs.length > 0) {
        amQuery.branch = { $in: filter.branchs.map(id => mongoose.Types.ObjectId(id)) };
    }
    if (!allowViewAll) {
        amQuery.department = mongoose.Types.ObjectId(req?.user?.department);
    }

    if (Object.keys(amQuery).length > 0) {
        const validAssetMaintenances = await AssetMaintenance.find(amQuery).select('_id');
        const amIds = validAssetMaintenances.map(asset => asset._id);
        filterMatch.assetMaintenance = { $in: amIds };
    }
    const customer1 = await Customer.findById(_customer1);
    if (!customer1) {
        throw new ApiError(httpStatus.NOT_FOUND, 'customer1 not found');
    }
    const customer2 = await Customer.findById(_customer2);
    if (!customer2) {
        throw new ApiError(httpStatus.NOT_FOUND, 'customer2 not found');
    }

    const breakdownTicketStatusNewCustomer1 = await Breakdown.countDocuments({
        customer: _customer1,
        ticketStatus: ticketBreakdownStatus.new,
        ...filterMatch,
    });
    const breakdownTicketStatusInProgressCustomer1 = await Breakdown.countDocuments({
        customer: _customer1,
        ticketStatus: ticketBreakdownStatus.inProgress,
        ...filterMatch,
    });
    const breakdownTicketStatusOverdueCustomer1 = await Breakdown.countDocuments({
        customer: _customer1,
        ticketStatus: {
            $in: [ticketBreakdownStatus.inProgress, ticketSchedulePreventiveStatus.new],
        },
        incidentDeadline: { $lt: new Date() },
        ...filterMatch,
    });

    const breakdownTicketStatusNewCustomer2 = await Breakdown.countDocuments({
        customer: _customer2,
        ticketStatus: ticketBreakdownStatus.new,
        ...filterMatch,
    });
    const breakdownTicketStatusInProgressCustomer2 = await Breakdown.countDocuments({
        customer: _customer2,
        ticketStatus: ticketBreakdownStatus.inProgress,
        ...filterMatch,
    });
    const breakdownTicketStatusOverdueCustomer2 = await Breakdown.countDocuments({
        customer: _customer2,
        ticketStatus: { $in: [ticketBreakdownStatus.inProgress, schedulePreventiveStatus.new] },
        incidentDeadline: { $lt: new Date() },
        ...filterMatch,
    });
    const customer1BreakdownData = {
        name: customer1.customerName,
        new: breakdownTicketStatusNewCustomer1,
        inProgress: breakdownTicketStatusInProgressCustomer1,
        overdue: breakdownTicketStatusOverdueCustomer1,
    };
    const customer2BreakdownData = {
        name: customer2.customerName,
        new: breakdownTicketStatusNewCustomer2,
        inProgress: breakdownTicketStatusInProgressCustomer2,
        overdue: breakdownTicketStatusOverdueCustomer2,
    };
    return {
        customer1BreakdownData,
        customer2BreakdownData,
    };
};
const getDataKPBIndicators = async (dateRangeType, req, filter) => {
    const filterMatch = {};
    // kiểm tra xem có được xem tất cả tài sản không
    let allowViewAll = true;
    let amIds = [];
    if (req.companySetting.filterByAccount) {
        const dep = await Department.findById(req.user.department).select('allowViewAll');
        allowViewAll = dep?.allowViewAll;
    }
    const amQuery = {};
    if (filter.branchs && Array.isArray(filter.branchs) && filter.branchs.length > 0) {
        amQuery.branch = { $in: filter.branchs.map(id => mongoose.Types.ObjectId(id)) };
    }
    if (!allowViewAll) {
        amQuery.department = mongoose.Types.ObjectId(req?.user?.department);
    }

    if (Object.keys(amQuery).length > 0) {
        const validAssetMaintenances = await AssetMaintenance.find(amQuery).select('_id');
        amIds = validAssetMaintenances.map(asset => asset._id);
        filterMatch.assetMaintenance = { $in: amIds };
    }
    const dateRanges = await dateRangeByResquests(dateRangeType);
    // lấy dữ liệu
    const data = await Promise.all(
        dateRanges.map(async (dateRange) => {
            const totalBreakdown = await Breakdown.countDocuments({
                $and: [
                    {
                        createdAt: {
                            $gte: dateRange.startDate,
                        },
                    },
                    {
                        createdAt: {
                            $lte: dateRange.endDate,
                        },
                    },
                    filterMatch,
                ],
            });
            const totalAssetMaintenance = await AssetMaintenance.countDocuments({
                $and: [
                    {
                        createdAt: {
                            $gte: dateRange.startDate,
                        },
                    },
                    {
                        createdAt: {
                            $lte: dateRange.endDate,
                        },
                    },
                ],
                // ...(allowViewAll === false && { department: mongoose.Types.ObjectId(req?.user?.department) }),
                // ...(filter.branchs && Array.isArray(filter.branchs) && filter.branchs.length > 0 && { branch: { $in: filter.branchs.map(id => mongoose.Types.ObjectId(id)) } }),
                ...amQuery,
            });
            const totalBreakdownSparePartResquest = await BreakdownSpareRequest.find({
                $and: [
                    {
                        createdAt: {
                            $gte: dateRange.startDate,
                        },
                    },
                    {
                        createdAt: {
                            $lte: dateRange.endDate,
                        },
                    },
                ],
            }).select('_id');
            const breakdownSparePartResquestIds = totalBreakdownSparePartResquest.map((item) => item._id);
            const totalSpareParts = await BreakdownSpareRequestDetail.aggregate([
                {
                    $match: {
                        breakdownSpareRequest: { $in: breakdownSparePartResquestIds },
                        requestStatus: {
                            $in: [breakdownSpareRequestDetailStatus.spareReplace],
                        },
                    },
                },
                {
                    $lookup: {
                        from: 'breakdownsparerequests',
                        localField: 'breakdownSpareRequest',
                        foreignField: '_id',
                        pipeline: [
                            {
                                $lookup: {
                                    from: 'breakdowns',
                                    localField: 'breakdown',
                                    foreignField: '_id',
                                    as: 'breakdown',
                                }
                            },
                        ],
                        as: 'breakdownSpareRequest',
                    }
                },
                { $match: { 'breakdownSpareRequest.breakdown.assetMaintenance': { $in: amIds } } },
                {
                    $group: {
                        _id: null,
                        totalQty: { $sum: '$qty' },
                    },
                },
            ]);

            const totalSchedulePreventiveSparePartResquest = await SchedulePrevetiveTaskSparePartRequestModel.find({
                $and: [
                    {
                        createdAt: {
                            $gte: dateRange.startDate,
                        },
                    },
                    {
                        createdAt: {
                            $lte: dateRange.endDate,
                        },
                    },
                ],
            }).select('_id');
            const schedulePreventiveSparePartResquestIds = totalSchedulePreventiveSparePartResquest.map((item) => item._id);
            const schedulePreventivePipeline = [];
            if (!allowViewAll) {
                schedulePreventivePipeline.push(
                    {
                        $lookup: {
                            from: 'scheduleprevetivetasksparepartrequests',
                            localField: 'schedulePrevetiveTaskSparePartRequest',
                            foreignField: '_id',
                            pipeline: [
                                {
                                    $lookup: {
                                        from: 'schedulepreventives',
                                        localField: 'schedulePreventive',
                                        foreignField: '_id',
                                        as: 'schedulePreventive',
                                    }
                                }
                            ],
                            as: 'schedulePrevetiveTaskSparePartRequest'
                        }
                    },
                    {
                        $match: {
                            'schedulePrevetiveTaskSparePartRequest.schedulePreventive.assetMaintenance': { $in: amIds }
                        }
                    }
                );
            }
            const totalSparePartSchedulePreventives = await SchedulePrevetiveTaskSparePartRequestDetailModel.aggregate([
                {
                    $match: {
                        schedulePrevetiveTaskSparePartRequest: { $in: schedulePreventiveSparePartResquestIds },
                        requestStatus: {
                            $in: [schedulePreventiveTaskRequestSparePartDetailStatus.spareReplace],
                        },
                    },
                },
                ...schedulePreventivePipeline,
                {
                    $group: {
                        _id: null,
                        totalQty: { $sum: '$qty' },
                    },
                },
            ]);
            const totalQtySparePart =
                (totalSpareParts.length > 0 ? totalSpareParts[0]?.totalQty : 0) +
                (totalSparePartSchedulePreventives.length > 0 ? totalSparePartSchedulePreventives[0]?.totalQty : 0);
            return {
                ...dateRange,
                totalBreakdown,
                totalAssetMaintenance,
                totalQtySparePart,
            };
        })
    );
    return data;
};
const verifyDurationMs = (assetMaintenance) => {
    if (!assetMaintenance.durationMs || assetMaintenance.durationMs < 0) {
    }
};
const totalOperationalMetrics = async (type, req, filter) => {
    const filterMatch = {};
    // kiểm tra xem có được xem tất cả tài sản không
    let allowViewAll = true;
    if (req.companySetting.filterByAccount) {
        const dep = await Department.findById(req.user.department).select('allowViewAll');
        allowViewAll = dep?.allowViewAll;
    }
    const amQuery = {};
    if (filter.branchs && Array.isArray(filter.branchs) && filter.branchs.length > 0) {
        amQuery.branch = { $in: filter.branchs.map(id => mongoose.Types.ObjectId(id)) };
    }
    if (!allowViewAll) {
        amQuery.department = mongoose.Types.ObjectId(req?.user?.department);
    }

    if (Object.keys(amQuery).length > 0) {
        const validAssetMaintenances = await AssetMaintenance.find(amQuery).select('_id');
        const amIds = validAssetMaintenances.map(asset => asset._id);
        filterMatch.assetMaintenance = { $in: amIds };
    }
    const dateRange = await dateKyIndicatorsRangeByResquest(type);
    const { startDate, endDate } = dateRange;

    const breakdowns = await Breakdown.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate, $lte: endDate },
                ...filterMatch,
            },
        },
    ]);

    const totalDateRangeAgg = await AssetMaintenance.aggregate([
        {
            $match: amQuery,
        },
        {
            $project: {
                start: {
                    $cond: [
                        {
                            $or: [
                                { $not: '$installationDate' },
                                { $gt: ['$installationDate', new Date(endDate)] },
                                { $lt: ['$installationDate', startDate] },
                            ],
                        },
                        startDate,
                        '$installationDate',
                    ],
                },
            },
        },
        {
            $group: {
                _id: null,
                totalDateRange: { $sum: { $subtract: [endDate, '$start'] } },
            },
        },
    ]);

    const totalDateRange = totalDateRangeAgg.length > 0 ? totalDateRangeAgg[0].totalDateRange : 0;
    const totalDowntimeHrs = await breakdownService.workingTimeBreakdowns(breakdowns.map((b) => b._id));

    // 4️⃣ Tính MTBF / MTTR
    const totalMTBFBreakdown = breakdowns.length > 0 ? (totalDateRange - totalDowntimeHrs) / breakdowns.length : 0;
    const totalMTTRBreakdown = breakdowns.length > 0 ? totalDowntimeHrs / breakdowns.length : 0;

    // 5️⃣ Tổng thời gian checkin/out của tất cả user cho toàn bộ breakdowns
    const [totalSpendTime] = await BreakdownAssignUserCheckinCheckOutModel.aggregate([
        {
            $match: { breakdown: { $in: breakdowns.map((b) => b._id) } },
        },
        {
            $group: {
                _id: null,
                totalSpendTime: { $sum: { $subtract: ['$logOutAt', '$logInAt'] } },
            },
        },
    ]);

    const totalSpendTimeMs = totalSpendTime?.totalSpendTime || 0;

    return {
        totalDowntimeHrs,
        totalMTBFBreakdown,
        totalMTTRBreakdown,
        totalSpendTimeMs,
    };
};

const getAssetMaintenanceReport = async (filter, options, req) => {
    // kiểm tra xem có được xem tất cả tài sản không
    let allowViewAll = true;
    if (req.companySetting.filterByAccount) {
        const dep = await Department.findById(req.user.department).select('allowViewAll');
        allowViewAll = dep?.allowViewAll;
    }
    if (!allowViewAll) {
        filter.department = mongoose.Types.ObjectId(req?.user?.department);
    }
    const assetMaintenances = await AssetMaintenance.paginate(filter, {
        ...options,
        populate: [
            {
                path: 'assetModel',
                populate: [
                    { path: 'manufacturer' },
                    { path: 'subCategory' },
                    { path: 'category' },
                    { path: 'assetTypeCategory' },
                    { path: 'asset' },
                ],
            },
            { path: 'resource' },
            { path: 'customer', select: 'customerName' },
            { path: 'building', select: 'buildingName' },
            { path: 'floor', select: 'floorName' },
            { path: 'department', select: 'departmentName' },
        ],
        lean: true,
    });

    const assetIds = assetMaintenances.results.map((a) => a._id);

    const counts = await Preventive.aggregate([
        {
            $match: { assetMaintenance: { $in: assetIds } },
        },
        // Lấy tất cả tasks của preventive
        {
            $lookup: {
                from: 'preventivetasks',
                localField: '_id',
                foreignField: 'preventive',
                as: 'tasks',
            },
        },
        // Lấy tất cả assignment của tasks từ PreventiveTaskAssignUser
        {
            $lookup: {
                from: 'preventivetaskassignusers',
                let: { taskIds: '$tasks._id' },
                pipeline: [{ $match: { $expr: { $in: ['$preventiveTask', '$$taskIds'] } } }],
                as: 'taskAssignments',
            },
        },
        // Tính các count theo yêu cầu
        {
            $group: {
                _id: '$assetMaintenance',
                configuredCount: { $sum: 1 }, // tất cả preventive
                createdCount: { $sum: { $cond: [{ $ne: ['$status', 'started'] }, 1, 0] } },
                assignedCount: {
                    $sum: {
                        $cond: [
                            {
                                $and: [
                                    { $ne: ['$status', 'started'] },
                                    { $gt: [{ $size: '$tasks' }, 0] }, // phải có task
                                    {
                                        $eq: [
                                            { $size: '$tasks' },
                                            { $size: '$taskAssignments' }, // tất cả task đều đã assign
                                        ],
                                    },
                                ],
                            },
                            1,
                            0,
                        ],
                    },
                },
            },
        },
    ]);

    // ---- Đếm SchedulePreventive đã được cấu hình (có task) ----
    const schedulePreventives = await SchedulePreventive.find(
        { assetMaintenance: { $in: assetIds } },
        '_id assetMaintenance'
    ).lean();
    const schedulePreventiveIds = schedulePreventives.map((s) => s._id);
    // Map schedulePreventiveId -> assetMaintenanceId
    const schedulePreventiveToAssetMap = {};
    schedulePreventives.forEach((s) => {
        schedulePreventiveToAssetMap[s._id.toString()] = s.assetMaintenance.toString();
    });

    // Convert counts thành map theo assetId
    const countsMap = counts.reduce((acc, c) => {
        acc[c._id.toString()] = c;
        return acc;
    }, {});

    // Gắn counts vào từng asset
    const resultsWithCounts = assetMaintenances.results.map((a) => ({
        ...a._doc,
        counts: countsMap[a._id.toString()] || { configuredCount: 0, createdCount: 0, assignedCount: 0 },
    }));

    // ---- Thống kê tổng hợp ----
    const uniqueCustomers = new Set();
    const uniqueBuildings = new Set();
    const uniqueFloors = new Set();
    const uniqueDepartments = new Set();
    const uniqueAssets = new Set();

    let totalConfigured = 0;
    let totalCreated = 0;
    let totalAssigned = 0;

    resultsWithCounts.forEach((a) => {
        if (a.customer?._id) uniqueCustomers.add(a.customer._id.toString());
        if (a.building?._id) uniqueBuildings.add(a.building._id.toString());
        if (a.floor?._id) uniqueFloors.add(a.floor._id.toString());
        if (a.department?._id) uniqueDepartments.add(a.department._id.toString());
        uniqueAssets.add(a._id.toString());

        totalConfigured += a.counts.configuredCount;
        totalCreated += a.counts.createdCount;
        totalAssigned += a.counts.assignedCount;
    });

    const summary = {
        customerCount: uniqueCustomers.size,
        buildingCount: uniqueBuildings.size,
        floorCount: uniqueFloors.size,
        departmentCount: uniqueDepartments.size,
        assetCount: uniqueAssets.size,
        totalConfigured,
        totalCreated,
        totalAssigned,
    };

    return {
        ...assetMaintenances,
        results: resultsWithCounts,
        summary,
    };
};
const getMyTicketCalender = async (_startDate, _endDate, user) => {
    const userId = typeof user === 'string' ? new mongoose.Types.ObjectId(user) : user;
    const startDate = new Date(_startDate);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(_endDate);
    endDate.setHours(23, 59, 59, 999);

    const breakdownAssignUsers = await BreakdownAssignUserModel.aggregate([
        {
            $lookup: {
                from: 'breakdowns',
                localField: 'breakdown',
                foreignField: '_id',
                as: 'breakdown',
            },
        },
        {
            $lookup: {
                from: 'assetmaintenances',
                localField: 'breakdown.assetMaintenance',
                foreignField: '_id',
                as: 'assetMaintenance',
            },
        },
        {
            $lookup: {
                from: 'assets',
                localField: 'assetMaintenance.asset',
                foreignField: '_id',
                as: 'asset',
            },
        },
        { $unwind: '$breakdown' },
        { $unwind: '$assetMaintenance' },
        { $unwind: '$asset' },
        {
            $match: {
                expectedRepairTime: {
                    $gte: startDate,
                    $lte: endDate,
                },
                user: userId,
                status: {
                    $in: [
                        breakdownAssignUserStatus.accepted,
                        breakdownAssignUserStatus.inProgress,
                        // breakdownAssignUserStatus.completed,
                        breakdownAssignUserStatus.requestForSupport,
                        breakdownAssignUserStatus.WCA,
                        breakdownAssignUserStatus.experimentalFix,
                        breakdownAssignUserStatus.pending_approval,
                        breakdownAssignUserStatus.approved,
                        breakdownAssignUserStatus.submitted,
                    ],
                },
            },
        },
        { $sort: { expectedRepairTime: 1 } },
    ]);
    return breakdownAssignUsers;
};
const mongoose = require('mongoose');
const SchedulePrevetiveTaskSparePartRequest = require('../../models/preventive/schedulePrevetiveTaskSparePartRequest.model');

const getMyTaskCalender = async (_startDate, _endDate, user) => {
    const userId = typeof user === 'string' ? new mongoose.Types.ObjectId(user) : user;
    const startDate = new Date(_startDate);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(_endDate);
    endDate.setHours(23, 59, 59, 999);

    const result = await SchedulePreventiveTaskAssignUserModel.aggregate([
        {
            $match: {
                user: userId,
                isCancel: false,
                status: {
                    $in: [
                        schedulePreventiveTaskAssignUserStatus.assigned,
                        schedulePreventiveTaskAssignUserStatus.accepted,
                        schedulePreventiveTaskAssignUserStatus.inProgress,
                        schedulePreventiveTaskAssignUserStatus.partiallyCompleted,
                        schedulePreventiveTaskAssignUserStatus.approved,
                        schedulePreventiveTaskAssignUserStatus.pendingApproval,
                        schedulePreventiveTaskAssignUserStatus.submitted,
                    ],
                },
            },
        },
        {
            $lookup: {
                from: 'schedulepreventives',
                let: { spId: '$schedulePreventive' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$_id', '$$spId'] },
                                    { $gte: ['$startDate', startDate] },
                                    { $lte: ['$startDate', endDate] },
                                ],
                            },
                        },
                    },
                ],
                as: 'schedulePreventive',
            },
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
                from: 'assets',
                localField: 'assetMaintenance.asset',
                foreignField: '_id',
                as: 'asset',
            },
        },
        { $unwind: '$schedulePreventive' },
        { $unwind: '$assetMaintenance' },
        { $unwind: '$asset' },
    ]);
    const schedulePreventiveTaskUserStatuses = result.length > 0 ? result : [];
    return schedulePreventiveTaskUserStatuses;
};
const getMyCalibrationCalender = async (_startDate, _endDate, user) => {
    const userId = typeof user === 'string' ? new mongoose.Types.ObjectId(user) : user;
    const startDate = new Date(_startDate);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(_endDate);
    endDate.setHours(23, 59, 59, 999);

    const result = await CalibrationWorkAssignUserModel.aggregate([
        {
            $match: {
                user: userId,
                status: {
                    $in: [
                        calibrationWorkAssignUserStatus.assigned,
                        calibrationWorkAssignUserStatus.accepted,
                        calibrationWorkAssignUserStatus.inProgress,
                        calibrationWorkAssignUserStatus.partiallyCompleted,
                        calibrationWorkAssignUserStatus.completeRecalibrationIssue,
                    ],
                },
            },
        },
        {
            $lookup: {
                from: 'calibrationworks',
                let: { spId: '$calibrationWork' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$_id', '$$spId'] },
                                    { $gte: ['$startDate', startDate] },
                                    { $lte: ['$startDate', endDate] },
                                ],
                            },
                        },
                    },
                ],
                as: 'calibrationWork',
            },
        },
        {
            $lookup: {
                from: 'assetmaintenances',
                localField: 'calibrationWork.assetMaintenance',
                foreignField: '_id',
                as: 'assetMaintenance',
            },
        },
        {
            $lookup: {
                from: 'assets',
                localField: 'assetMaintenance.asset',
                foreignField: '_id',
                as: 'asset',
            },
        },
        { $unwind: '$calibrationWork' },
        { $unwind: '$assetMaintenance' },
        { $unwind: '$asset' },
    ]);
    const calibrationWorkUserStatuses = result.length > 0 ? result : [];
    console.log('calibrationWorkUserStatuses', calibrationWorkUserStatuses);
    return calibrationWorkUserStatuses;
};
// const insertSql = async () => {
//     try {
//         // make sure that any items are correctly URL encoded in the connection string
//         await sql.connect('Server=103.214.9.61,14336;User Id=pnp; Password=123456a@; Encrypt=True;TrustServerCertificate=True;Connection Timeout=300; Database=Pnp_Internal;')
//         const _provinces = await ProvinceModel.find();
//         _provinces.forEach(async (_province) => {
//             const request = new sql.Request()
//             const provinceId = crypto.randomUUID();
//             const provinceSql = await request.query(`insert into Province (Id, Name, Code,Slug,Type,NameWithType) values ('${provinceId}',N'${_province.name}',${_province.code},N'${_province.slug}',N'${_province.type}',N'${_province.nameWithType}')`)
//             var communes = await CommuneModel.find({
//                 province: _province._id
//             })
//             communes.forEach(async (_commune) => {
//                 var a = _commune.name;
//                 var name = a.replace("'", "''")
//                 if (name.search('Leo') > -1) {

//                     console.log('name', a.replace("'", "''"))
//                 }
//                 var path = _commune.path.replace("'", "''");
//                 var nameWithType = _commune.nameWithType.replace("'", "''");
//                 var pathWithType = _commune.pathWithType.replace("'", "''")
//                 const _communeSQL = await request.query(`insert into District (Id, Name, ProvinceId ,Code , Slug, Type,NameWithType,Path,PathWithType) values (NEWID(),N'${name}','${provinceId}',${_commune.code},N'${_commune.slug}',N'${_commune.type}',N'${nameWithType}',N'${path}',N'${pathWithType}')`)
//             })
//         })
//     } catch (err) {
//         console.log('err', err)
//         // ... error checks
//     }
// }
const compareGroupStatusCalibrationWorkByCustomer = async (_customer1, _customer2, req, filter) => {
    const filterMatch = {};
    // kiểm tra xem có được xem tất cả tài sản không
    let allowViewAll = true;
    if (req.companySetting.filterByAccount) {
        const dep = await Department.findById(req.user.department).select('allowViewAll');
        allowViewAll = dep?.allowViewAll;
    }
    const amQuery = {};
    if (filter.branchs && Array.isArray(filter.branchs) && filter.branchs.length > 0) {
        amQuery.branch = { $in: filter.branchs.map(id => mongoose.Types.ObjectId(id)) };
    }
    if (!allowViewAll) {
        amQuery.department = mongoose.Types.ObjectId(req?.user?.department);
    }

    if (Object.keys(amQuery).length > 0) {
        const validAssetMaintenances = await AssetMaintenance.find(amQuery).select('_id');
        const amIds = validAssetMaintenances.map(asset => asset._id);
        filterMatch.assetMaintenance = { $in: amIds };
    }
    const customer1 = await Customer.findById(_customer1);
    if (!customer1) {
        throw new ApiError(httpStatus.NOT_FOUND, 'customer1 not found');
    }
    const customer2 = await Customer.findById(_customer2);
    if (!customer2) {
        throw new ApiError(httpStatus.NOT_FOUND, 'customer2 not found');
    }
    const endDateAgo = new Date();
    endDateAgo.setDate(endDateAgo.getDate() + 2);
    const calibrationWorkStatusNewCustomer1 = await CalibrationWorkModel.countDocuments({
        customer: _customer1,
        groupStatus: calibrationWorkGroupStatus.new,
        startDate: { $lte: endDateAgo },
        ...filterMatch,
    });
    const calibrationWorkStatusInProgressCustomer1 = await CalibrationWorkModel.countDocuments({
        customer: _customer1,
        groupStatus: calibrationWorkGroupStatus.inProgress,
        ...filterMatch,
    });
    const calibrationWorkStatusOverdueCustomer1 = await CalibrationWorkModel.countDocuments({
        customer: _customer1,
        groupStatus: { $in: [calibrationWorkGroupStatus.inProgress, calibrationWorkGroupStatus.new] },
        $expr: {
            $lt: [
                {
                    $add: [
                        '$startDate',
                        { $multiply: ['$calibrationTimeHr', 60 * 60 * 1000] },
                        { $multiply: ['$calibrationTimeHr', 60 * 1000] },
                    ],
                },
                new Date(),
            ],
        },
        ...filterMatch,
    });

    const calibrationWorkStatusNewCustomer2 = await CalibrationWorkModel.countDocuments({
        customer: _customer2,
        startDate: { $lte: endDateAgo },
        groupStatus: calibrationWorkGroupStatus.new,
        ...filterMatch,
    });
    const calibrationWorkStatusInProgressCustomer2 = await CalibrationWorkModel.countDocuments({
        customer: _customer2,
        groupStatus: calibrationWorkGroupStatus.inProgress,
        ...filterMatch,
    });
    const calibrationWorkStatusOverdueCustomer2 = await CalibrationWorkModel.countDocuments({
        customer: _customer2,
        groupStatus: { $in: [calibrationWorkGroupStatus.inProgress, calibrationWorkGroupStatus.new] },
        $expr: {
            $lt: [
                {
                    $add: [
                        '$startDate',
                        { $multiply: ['$calibrationTimeHr', 60 * 60 * 1000] },
                        { $multiply: ['$calibrationTimeHr', 60 * 1000] },
                    ],
                },
                new Date(),
            ],
        },
        ...filterMatch,
    });
    const customer1CalibrationWork = {
        name: customer1.customerName,
        new: calibrationWorkStatusNewCustomer1,
        inProgress: calibrationWorkStatusInProgressCustomer1,
        overdue: calibrationWorkStatusOverdueCustomer1,
    };
    const customer2CalibrationWork = {
        name: customer2.customerName,
        new: calibrationWorkStatusNewCustomer2,
        inProgress: calibrationWorkStatusInProgressCustomer2,
        overdue: calibrationWorkStatusOverdueCustomer2,
    };
    return {
        customer1CalibrationWork,
        customer2CalibrationWork,
    };
};
const getCalibrationWorkCompliance = async (type, req, filter) => {
    const filterMatch = {};
    // kiểm tra xem có được xem tất cả tài sản không
    let allowViewAll = true;
    if (req.companySetting.filterByAccount) {
        const dep = await Department.findById(req.user.department).select('allowViewAll');
        allowViewAll = dep?.allowViewAll;
    }
    const amQuery = {};
    if (filter.branchs && Array.isArray(filter.branchs) && filter.branchs.length > 0) {
        amQuery.branch = { $in: filter.branchs.map(id => mongoose.Types.ObjectId(id)) };
    }
    if (!allowViewAll) {
        amQuery.department = mongoose.Types.ObjectId(req?.user?.department);
    }

    if (Object.keys(amQuery).length > 0) {
        const validAssetMaintenances = await AssetMaintenance.find(amQuery).select('_id');
        const amIds = validAssetMaintenances.map(asset => asset._id);
        filterMatch.assetMaintenance = { $in: amIds };
    }
    const { startDate, endDate } = await dateKyIndicatorsRangeByResquest(type);

    const baseQuery = {
        startDate: { $gte: startDate, $lte: endDate },
        status: { $ne: calibrationWorkStatus.cancelled },
    };

    const [total, completed] = await Promise.all([
        CalibrationWorkModel.countDocuments({
            ...baseQuery,
            ...filterMatch,
        }),
        CalibrationWorkModel.countDocuments({
            ...baseQuery,
            status: calibrationWorkStatus.completed,
            ...filterMatch,
        }),
    ]);

    return {
        percentCalibrationWork: total ? Math.round((completed / total) * 100) : 0,
    };
};

module.exports = {
    getBreakdownChart,
    getSchedulePreventiveChart,
    getSchedulePreventiveCompliance,
    getBreakdownCompliance,
    getUpTimeAssetMaintenance,
    getSchedulePreventiveVsAssignUser,
    getAverageResponseTimeBreakdown,
    getAverageResolutionTimeBreakdown,
    compareTicketStatusSchedulePreventiveByCustomer,
    compareTicketStatusBreakdownByCustomer,
    getDataKPBIndicators,
    totalOperationalMetrics,
    getAssetMaintenanceReport,
    getMyTicketCalender,
    getMyTaskCalender,
    getMyCalibrationCalender,
    compareGroupStatusCalibrationWorkByCustomer,
    getCalibrationWorkChart,
    getCalibrationWorkCompliance,
};
