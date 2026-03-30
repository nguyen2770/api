const pick = require('../../utils/pick');
const catchAsync = require('../../utils/catchAsync');
const reportService = require('../../services/report/report.service');
const {
    breakdownSpareRequestService,
    breakdownService,
    suppliesNeedService,
    requestPurchaseService,
    schedulePreventiveService,
    breakdownAssignUserService,
    approvalTaskService,
    schedulePrevetiveTaskSparePartRequestService,
} = require('../../services');
const { BreakdownAssignUserModel, AssetModel } = require('../../models');
const {
    schedulePreventiveTaskAssignUserStatus,
    schedulePreventiveTaskRequestSparePartStatus,
} = require('../../utils/constant');
const getBreakdownChart = catchAsync(async (req, res) => {
    const filter = pick(req.body, ['branchs']);
    const data = await reportService.getBreakdownChart(req.body.dateRangeType, req.body.rangeCount, req, filter);
    res.send({ code: 1, data });
});

const getSchedulePreventiveChart = catchAsync(async (req, res) => {
    const filter = pick(req.body, ['branchs']);
    const data = await reportService.getSchedulePreventiveChart(req.body.dateRangeType, req.body.rangeCount, req, filter);
    res.send({ code: 1, data });
});

const getApproveWorks = catchAsync(async (req, res) => {
    const options = pick(req.body, ['sortBy', 'limit', 'page']);
    const filter = pick(req.body, ['code', 'branchs']);
    filter.status = "PENDING";
    const data = await approvalTaskService.queryApprovalTask(filter, options, req);
    res.send({ code: 1, data });
});

// const getApproveWorks = catchAsync(async (req, res) => {
//     const options = pick(req.query, ['limit', 'page']);
//     options.limit = parseInt(options.limit, 10) || 10;
//     options.page = parseInt(options.page, 10) || 1;

//     const filter = pick(req.query, ['name']);
//     const approveWorks = [];
//     const assetMaintenanceFilter = {}; // giữ nguyên để tránh lỗi
//     // === PARALLEL QUERY TOÀN BỘ ===
//     const [
//         breakdownSpareRequests,
//         schedulePreventiveSpareParts,
//         closeBreakdowns,
//         approvedSuppliesNeed,
//         approvedPurchaseRequest,
//         schedulePreventiveRes,
//         closeExperimentalFix,
//     ] = await Promise.all([
//         breakdownSpareRequestService.queryBreakdownSpareRequests(
//             { ...filter, requestStatus: 'approved' },
//             { page: 1, limit: 100 }
//         ),
//         schedulePrevetiveTaskSparePartRequestService.querySchedulePrevetiveTaskSparePartRequests(
//             { ...filter, status: schedulePreventiveTaskRequestSparePartStatus.pendingApproval },
//             { page: 1, limit: 100 }
//         ),
//         breakdownService.queryBreakdowns(
//             { ...filter, ticketStatuses: ['completed'] },
//             { page: 1, limit: 100 },
//             assetMaintenanceFilter 
//         ),

//         suppliesNeedService.querySuppliesNeeds({ ...filter, action: 'pendingApproval' }, { page: 1, limit: 100 }),

//         requestPurchaseService.queryRequestPurchases({ ...filter, action: 'pendingApproval' }, { page: 1, limit: 100 }),

//         schedulePreventiveService.querySchedulePreventives(
//             { status: 'waitingForAdminApproval', ticketStatus: 'inProgress' },
//             { page: 1, limit: 100 }
//         ),

//         breakdownAssignUserService.getBreackDownAssignUserByStatus(),
//     ]);
//     // === 1. BREAKDOWN SPARE REQUESTS ===
//     breakdownSpareRequests.results.forEach((item) => {
//         approveWorks.push({
//             ...item,
//             createdAt: item.createdAt,
//             code: item.code,
//             type: 'spare_request',
//         });
//     });
//     // === 1. schedulePreventiveSpareParts SPARE REQUESTS ===
//     schedulePreventiveSpareParts.results.forEach((item) => {
//         approveWorks.push({
//             ...item.toJSON(),
//             createdAt: item.createdAt,
//             code: item.code,
//             type: 'spare_request_schedule_preventive',
//         });
//     });

//     // 2. CLOSE BREAKDOWNS
//     const breakdownIds = closeBreakdowns.breakdowns.map(b => b._id);

//     const [assignUsersAll, breakdownDetailsAll] = await Promise.all([
//         BreakdownAssignUserModel.find({ breakdown: { $in: breakdownIds } })
//             .populate('user')
//             .lean(),

//         Promise.all(breakdownIds.map((id) => breakdownService.getBreakdownById(id))),
//     ]);

//     const assignUsersMap = {};
//     assignUsersAll.forEach((u) => {
//         const id = u.breakdown.toString();
//         if (!assignUsersMap[id]) assignUsersMap[id] = [];
//         assignUsersMap[id].push({ ...u, id: u._id });
//     });

//     const breakdownDetailMap = {};
//     breakdownIds.forEach((id, i) => {
//         breakdownDetailMap[id.toString()] = breakdownDetailsAll[i].toObject();
//     });

//     closeBreakdowns.breakdowns.forEach((item) => {
//         let workingTime = null;
//         if (item.closingDate && item.createdAt) {
//             workingTime = ((new Date(item.closingDate) - new Date(item.createdAt)) / (1000 * 60 * 60)).toFixed(2);
//         }

//         approveWorks.push({
//             ...item,
//             id: item._id,
//             ...breakdownDetailMap[item._id.toString()],
//             workingTime,
//             breakdownAssignUsers: assignUsersMap[item._id.toString()] || [],
//             createdAt: item.createdAt,
//             code: item.code,
//             type: 'close_breakdown',
//         });
//     });

//     // // === 3. SUPPLIES NEED ===
//     // approvedSuppliesNeed.results.forEach(item => {
//     //     approveWorks.push({
//     //         ...item.toJSON(),
//     //         createdAt: item.createdAt,
//     //         code: item.code,
//     //         type: 'supplies_need'
//     //     });
//     // });

//     // // === 4. PURCHASE REQUEST ===
//     // approvedPurchaseRequest.results.forEach(item => {
//     //     approveWorks.push({
//     //         ...item.toJSON(),
//     //         createdAt: item.createdAt,
//     //         code: item.code,
//     //         type: 'purchase_request'
//     //     });
//     // });

//     // === 5. SCHEDULE PREVENTIVES===
//     const schedulePreventives = schedulePreventiveRes._schedulePreventives;

//     const scheduleIds = schedulePreventives.map((s) => s._id);

//     const [tasksAll, sparePartsAll, downTimesAll] = await Promise.all([
//         schedulePreventiveService.getSchedulePreventiveTaskByRes({ schedulePreventive: { $in: scheduleIds } }),
//         schedulePreventiveService.getSchedulePreventiveSparePartByRes({ schedulePreventive: { $in: scheduleIds } }),
//         Promise.all(scheduleIds.map((id) => schedulePreventiveService.totalDownTimeSchedulePreventive(id))),
//     ]);

//     const taskMap = {};
//     tasksAll.forEach((t) => {
//         const id = t.schedulePreventive.toString();
//         if (!taskMap[id]) taskMap[id] = [];
//         taskMap[id].push(t);
//     });

//     const spareMap = {};
//     sparePartsAll.forEach((t) => {
//         const id = t.schedulePreventive.toString();
//         if (!spareMap[id]) spareMap[id] = [];
//         spareMap[id].push(t);
//     });

//     schedulePreventives.forEach((item, index) => {
//         approveWorks.push({
//             ...item,
//             schedulePreventiveTasks: taskMap[item._id.toString()] || [],
//             schedulePreventiveSparePart: spareMap[item._id.toString()] || [],
//             totalDownTimeSchedulePreventive: downTimesAll[index],
//             createdAt: item.createdAt,
//             code: item.code,
//             type: 'schedule-preventive',
//         });
//     });

//     // === 6. EXPERIMENTAL FIX ===
//     closeExperimentalFix.forEach((item) => {
//         approveWorks.push({
//             ...item.toJSON(),
//             createdAt: item.createdAt,
//             code: item.breakdown.code,
//             type: 'experimental-fix',
//         });
//     });

//     // === SORT + PAGINATE ===
//     approveWorks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

//     const start = (options.page - 1) * options.limit;
//     const pagedData = approveWorks.slice(start, start + options.limit);

//     res.send({ code: 1, total: approveWorks.length, data: pagedData });
// });

const updateApprovalTaskStatusProcessed = catchAsync(async (req, res) => {
    const payload = {
        processedAt: new Date(),
        processedBy: req.user.id,
        status: "PROCESSED"
    }
    const data = await approvalTaskService.updateApprovalTask(req.body.id, payload);
    res.send({ code: 1, data });
})

// const getApproveWorks = catchAsync(async (req, res) => {
//     const options = pick(req.query, ['limit', 'page']);
//     options.limit = parseInt(options.limit, 10) || 10;
//     options.page = parseInt(options.page, 10) || 1;

//     const filter = pick(req.query, ['name']);
//     const approveWorks = [];
//     const assetMaintenanceFilter = {}; // giữ nguyên để tránh lỗi

//     // === PARALLEL QUERY TOÀN BỘ ===
//     const [
//         breakdownSpareRequests,
//         closeBreakdowns,
//         approvedSuppliesNeed,
//         approvedPurchaseRequest,
//         schedulePreventiveRes,
//         closeExperimentalFix
//     ] = await Promise.all([
//         breakdownSpareRequestService.queryBreakdownSpareRequests(
//             { ...filter, requestStatus: 'approved' },
//             { page: 1, limit: 100 }
//         ),

//         breakdownService.queryBreakdowns(
//             { ...filter, ticketStatuses: ['completed'] },
//             { page: 1, limit: 100 },
//             assetMaintenanceFilter // PARAM BẮT BUỘC – KHÔNG ĐƯỢC XOÁ
//         ),

//         suppliesNeedService.querySuppliesNeeds(
//             { ...filter, action: 'pendingApproval' },
//             { page: 1, limit: 100 }
//         ),

//         requestPurchaseService.queryRequestPurchases(
//             { ...filter, action: 'pendingApproval' },
//             { page: 1, limit: 100 }
//         ),

//         schedulePreventiveService.querySchedulePreventives(
//             { status: 'waitingForAdminApproval', ticketStatus: 'inProgress' },
//             { page: 1, limit: 100 }
//         ),

//         breakdownAssignUserService.getBreackDownAssignUserByStatus()
//     ]);

//     // === 1. BREAKDOWN SPARE REQUESTS ===
//     breakdownSpareRequests.results.forEach(item => {
//         approveWorks.push({
//             ...item,
//             createdAt: item.createdAt,
//             code: item.code,
//             type: 'spare_request'
//         });
//     });

//     // === 2. CLOSE BREAKDOWNS – GIẢM QUERY BẰNG BATCH ===
//     const breakdownIds = closeBreakdowns.breakdowns.map(b => b._id);

//     const [assignUsersAll, breakdownDetailsAll] = await Promise.all([
//         BreakdownAssignUserModel.find({ breakdown: { $in: breakdownIds } }).populate('user').lean(),

//         Promise.all(breakdownIds.map(id => breakdownService.getBreakdownById(id)))
//     ]);

//     const assignUsersMap = {};
//     assignUsersAll.forEach(u => {
//         const id = u.breakdown.toString();
//         if (!assignUsersMap[id]) assignUsersMap[id] = [];
//         assignUsersMap[id].push({ ...u, id: u._id });
//     });

//     const breakdownDetailMap = {};
//     breakdownIds.forEach((id, i) => {
//         breakdownDetailMap[id.toString()] = breakdownDetailsAll[i].toObject();
//     });

//     closeBreakdowns.breakdowns.forEach(item => {
//         let workingTime = null;
//         if (item.closingDate && item.createdAt) {
//             workingTime = ((new Date(item.closingDate) - new Date(item.createdAt)) / (1000 * 60 * 60)).toFixed(2);
//         }

//         approveWorks.push({
//             ...item,
//             id: item._id,
//             ...breakdownDetailMap[item._id.toString()],
//             workingTime,
//             breakdownAssignUsers: assignUsersMap[item._id.toString()] || [],
//             createdAt: item.createdAt,
//             code: item.code,
//             type: 'close_breakdown'
//         });
//     });

//     // // === 3. SUPPLIES NEED ===
//     // approvedSuppliesNeed.results.forEach(item => {
//     //     approveWorks.push({
//     //         ...item.toJSON(),
//     //         createdAt: item.createdAt,
//     //         code: item.code,
//     //         type: 'supplies_need'
//     //     });
//     // });

//     // // === 4. PURCHASE REQUEST ===
//     // approvedPurchaseRequest.results.forEach(item => {
//     //     approveWorks.push({
//     //         ...item.toJSON(),
//     //         createdAt: item.createdAt,
//     //         code: item.code,
//     //         type: 'purchase_request'
//     //     });
//     // });

//     // === 5. SCHEDULE PREVENTIVES – TỐI ƯU TRÁNH QUERY LẶP ===
//     const schedulePreventives = schedulePreventiveRes._schedulePreventives;

//     const scheduleIds = schedulePreventives.map(s => s._id);

//     const [
//         tasksAll,
//         sparePartsAll,
//         downTimesAll
//     ] = await Promise.all([
//         schedulePreventiveService.getSchedulePreventiveTaskByRes({ schedulePreventive: { $in: scheduleIds } }),
//         schedulePreventiveService.getSchedulePreventiveSparePartByRes({ schedulePreventive: { $in: scheduleIds } }),
//         Promise.all(scheduleIds.map(id => schedulePreventiveService.totalDownTimeSchedulePreventive(id)))
//     ]);

//     const taskMap = {};
//     tasksAll.forEach(t => {
//         const id = t.schedulePreventive.toString();
//         if (!taskMap[id]) taskMap[id] = [];
//         taskMap[id].push(t);
//     });

//     const spareMap = {};
//     sparePartsAll.forEach(t => {
//         const id = t.schedulePreventive.toString();
//         if (!spareMap[id]) spareMap[id] = [];
//         spareMap[id].push(t);
//     });

//     schedulePreventives.forEach((item, index) => {
//         approveWorks.push({
//             ...item,
//             schedulePreventiveTasks: taskMap[item._id.toString()] || [],
//             schedulePreventiveSparePart: spareMap[item._id.toString()] || [],
//             totalDownTimeSchedulePreventive: downTimesAll[index],
//             createdAt: item.createdAt,
//             code: item.code,
//             type: 'schedule-preventive'
//         });
//     });

//     // === 6. EXPERIMENTAL FIX ===
//     closeExperimentalFix.forEach(item => {
//         approveWorks.push({
//             ...item.toJSON(),
//             createdAt: item.createdAt,
//             code: item.breakdown.code,
//             type: 'experimental-fix'
//         });
//     });

//     // === SORT + PAGINATE ===
//     approveWorks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

//     const start = (options.page - 1) * options.limit;
//     const pagedData = approveWorks.slice(start, start + options.limit);

//     res.send({ code: 1, total: approveWorks.length, data: pagedData });
// });

const getSchedulePreventiveCompliance = catchAsync(async (req, res) => {
    const filter = pick(req.body, ['branchs']);
    const data = await reportService.getSchedulePreventiveCompliance(req.body.type, req, filter);
    res.send({ code: 1, ...data });
});
const getBreakdownCompliance = catchAsync(async (req, res) => {
    const filter = pick(req.body, ['branchs']);
    const data = await reportService.getBreakdownCompliance(req.body.type, req, filter);
    res.send({ code: 1, ...data });
});
const getUpTimeAssetMaintenance = catchAsync(async (req, res) => {
    const filter = pick(req.body, ['branchs']);
    const data = await reportService.getUpTimeAssetMaintenance(req.body.type, req, filter);
    res.send({ code: 1, data });
});
const getSchedulePreventiveVsAssignUser = catchAsync(async (req, res) => {
    const filter = pick(req.body, ['branchs']);
    const data = await reportService.getSchedulePreventiveVsAssignUser(req.body.type, req, filter);
    res.send({ code: 1, data });
});
const getAverageResponseTimeBreakdown = catchAsync(async (req, res) => {
    const filter = pick(req.body, ['branchs']);
    const data = await reportService.getAverageResponseTimeBreakdown(req.body.type, req, filter);
    res.send({ code: 1, data });
});
const getAverageResolutionTimeBreakdown = catchAsync(async (req, res) => {
    const filter = pick(req.body, ['branchs']);
    const data = await reportService.getAverageResolutionTimeBreakdown(req.body.type, req, filter);
    res.send({ code: 1, data });
});
const compareStatusSchedulePreventiveAndBreakdownByCustomer = catchAsync(async (req, res) => {
    const filter = pick(req.body, ['branchs']);
    const dataSchedule = await reportService.compareTicketStatusSchedulePreventiveByCustomer(
        req.body.customer1,
        req.body.customer2,
        req,
        filter,
    );
    const dataBreakdown = await reportService.compareTicketStatusBreakdownByCustomer(req.body.customer1, req.body.customer2, req, filter);
    const dataCalibrationWork = await reportService.compareGroupStatusCalibrationWorkByCustomer(
        req.body.customer1,
        req.body.customer2,
        req,
        filter,
    );
    res.send({
        code: 1,
        data: {
            dataSchedule,
            dataBreakdown,
            dataCalibrationWork
        },
    });
});

function toStartOfDay(dateStr) {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    return d;
}

function toEndOfDay(dateStr) {
    const d = new Date(dateStr);
    d.setHours(23, 59, 59, 999);
    return d;
}

const spareMovementReport = catchAsync(async (req, res) => {
    let { page = 1, limit = 10 } = req.body;
    const { spareCategoryId, spareSubCategoryId, sparePart, startDate, endDate } = req.body;

    page = parseInt(page, 10) || 1;
    limit = parseInt(limit, 10) || 10;

    // Định dạng lại ngày
    const formattedStartDate = startDate ? new Date(toStartOfDay(startDate).toISOString()) : null;
    const formattedEndDate = endDate ? new Date(toEndOfDay(endDate).toISOString()) : null;

    const result = await breakdownSpareRequestService.getSparePartMovemen({
        page,
        limit,
        spareCategoryId,
        spareSubCategoryId,
        sparePart,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        req,
    });

    res.send({ code: 1, data: result });
});

const sparePartsUsageSummaryReport = catchAsync(async (req, res) => {
    let { page = 1, limit = 10 } = req.body;
    const { spareCategoryId, spareSubCategoryId, sparePart, startDate, endDate } = req.body;

    page = parseInt(page, 10) || 1;
    limit = parseInt(limit, 10) || 10;

    // Định dạng lại ngày
    const formattedStartDate = startDate ? new Date(toStartOfDay(startDate).toISOString()) : null;
    const formattedEndDate = endDate ? new Date(toEndOfDay(endDate).toISOString()) : null;

    const result = await breakdownSpareRequestService.getSparePartsUsageSummary({
        page,
        limit,
        spareCategoryId,
        spareSubCategoryId,
        sparePart,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        req,
    });

    res.send({ code: 1, data: result });
});

const getDataKPBIndicators = catchAsync(async (req, res) => {
    const filter = pick(req.body, ['branchs']);
    const data = await reportService.getDataKPBIndicators(req.body.type, req, filter);
    res.send({ code: 1, data });
});
const totalOperationalMetrics = catchAsync(async (req, res) => {
    const filter = pick(req.body, ['branchs']);
    const data = await reportService.totalOperationalMetrics(req.body.type, req, filter);
    res.send({ code: 1, data });
});
const getAssetMaintenanceReport = catchAsync(async (req, res) => {
    const options = pick(req.body, ['sortBy', 'limit', 'page']);
    // Hàm chuyển chuỗi về mảng nếu cần
    const toArr = (val) => (Array.isArray(val) ? val : typeof val === 'string' ? val.split(',') : []);

    const filter = {};
    let assetModelIds = null;

    if (req.body.manufacturer || req.body.category) {
        const assetModelFilter = {};
        if (req.body.manufacturer) assetModelFilter.manufacturer = { $in: toArr(req.body.manufacturer) };
        if (req.body.category) assetModelFilter.category = { $in: toArr(req.body.category) };

        // Truy vấn assetModel collection, chỉ lấy các _id phù hợp
        assetModelIds = await AssetModel.find(assetModelFilter).distinct('_id');
    }

    if (assetModelIds && assetModelIds.length > 0) {
        filter.assetModel = { $in: assetModelIds };
    }
    if (req.body.customer) filter.customer = { $in: toArr(req.body.customer) };
    if (req.body.building) filter.building = { $in: toArr(req.body.building) };
    if (req.body.floor) filter.floor = { $in: toArr(req.body.floor) };
    if (req.body.department) filter.department = { $in: toArr(req.body.department) };
    if (req.body.asset) filter.asset = { $in: toArr(req.body.asset) };
    if (req.body.assetModel) filter.assetModel = { $in: toArr(req.body.assetModel) };
    if (req.body.assetStyle) filter.assetStyle = { $in: [Number(req.body.assetStyle)] };
    if (req.body.assetMaintenance) filter._id = { $in: toArr(req.body.assetMaintenance) };
    if (req.body.branchs) filter.branch = { $in: toArr(req.body.branchs) };

    const result = await reportService.getAssetMaintenanceReport(filter, options, req);
    res.send({ code: 1, ...result });
});
const getMyTicketCalender = catchAsync(async (req, res) => {
    const { startDate, endDate } = req.query;
    const data = await reportService.getMyTicketCalender(startDate, endDate, req.user.id);
    res.send({ code: 1, data });
});
const getMyTaskCalender = catchAsync(async (req, res) => {
    const { startDate, endDate } = req.query;
    const data = await reportService.getMyTaskCalender(startDate, endDate, req.user.id);
    res.send({ code: 1, data });
});
const getMyCalibrationCalender = catchAsync(async (req, res) => {
    const { startDate, endDate } = req.query;
    const data = await reportService.getMyCalibrationCalender(startDate, endDate, req.user.id);
    res.send({ code: 1, data });
});
const getCalibrationWorkChart = catchAsync(async (req, res) => {
    const filter = pick(req.body, ['branchs']);
    const data = await reportService.getCalibrationWorkChart(req.body.dateRangeType, req.body.rangeCount, req, filter);
    res.send({ code: 1, data });
});
const getCalibrationWorkCompliance = catchAsync(async (req, res) => {
    const filter = pick(req.body, ['branchs']);
    const data = await reportService.getCalibrationWorkCompliance(req.body.type, req, filter);
    res.send({ code: 1, ...data });
});
module.exports = {
    getBreakdownChart,
    getSchedulePreventiveChart,
    getApproveWorks,
    getSchedulePreventiveCompliance,
    getBreakdownCompliance,
    getUpTimeAssetMaintenance,
    getSchedulePreventiveVsAssignUser,
    getAverageResponseTimeBreakdown,
    getAverageResolutionTimeBreakdown,
    compareStatusSchedulePreventiveAndBreakdownByCustomer,
    getDataKPBIndicators,
    totalOperationalMetrics,
    spareMovementReport,
    sparePartsUsageSummaryReport,
    getDataKPBIndicators,
    totalOperationalMetrics,
    getAssetMaintenanceReport,
    getMyTicketCalender,
    getMyTaskCalender,
    updateApprovalTaskStatusProcessed,
    getMyCalibrationCalender,
    getCalibrationWorkChart,
    getCalibrationWorkCompliance
};
