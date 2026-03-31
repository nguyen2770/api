const { reportSchedulePreventiveService, schedulePreventiveService } = require('../../services');
const catchAsync = require('../../utils/catchAsync');
const { schedulePreventiveStatus } = require('../../utils/constant');
const pick = require('../../utils/pick');

const getSumaryProcecssingSattusSchedulePreventive = catchAsync(async (req, res) => {
    const { startDate, endDate } = req.body;
    const options = pick(req.body, ['sortBy', 'sortOrder', 'limit', 'page']);
    const filter = pick(req.body, ['customerName', 'assetModelName', 'branchs']);
    const data = await reportSchedulePreventiveService.getTotalParameterSchedulePreventive(startDate, endDate, filter, req);
    const schedulePreventives = await reportSchedulePreventiveService.getSumaryProcecssingSattusSchedulePreventive(startDate, endDate, options, filter, req);
    res.send({ code: 1, data: { ...data, ...schedulePreventives } });
});

const getDetailsProcecssingSattusSchedulePreventive = catchAsync(async (req, res) => {
    const { startDate, endDate } = req.body;
    const options = pick(req.body, ['sortBy', 'sortOrder', 'limit', 'page']);
    const filter = pick(req.body, ['customerName', 'code', 'preventiveName', 'assetName', 'assetModelName', 'status', 'branchs']);
    const data = await reportSchedulePreventiveService.getTotalParameterSchedulePreventive(startDate, endDate, filter, req);
    const schedulePreventives = await reportSchedulePreventiveService.getDetailsProcecssingSattusSchedulePreventive(startDate, endDate, options, filter, req);

    const breakdownsWithDownTime = await Promise.all(
        schedulePreventives.results.map(async (_data) => {
            const plainBreakdown = _data.toObject ? _data.toObject() : _data;
            return {
                ...plainBreakdown,
                id: _data._id,
                plannedHours: (_data.status !== schedulePreventiveStatus.cancelled) ? (_data.maintenanceDurationHr * 60 * 60 * 1000 + _data.maintenanceDurationMin * 60 * 1000) : 0,
                downtime: (_data.status !== schedulePreventiveStatus.cancelled) ? (_data.downtimeHr * 60 * 60 * 1000 + _data.downtimeMin * 60 * 1000) : 0,
            };
        })
    );

    res.send({
        code: 1, data: {
            ...data,
            schedulePreventives: breakdownsWithDownTime,
            totalResults: schedulePreventives.totalResults,
            totalPages: schedulePreventives.totalPages,
            page: schedulePreventives.page,
            limit: schedulePreventives.limit,
        }
    });
});
const getSummaryReportEngineerPerformanceInSchedulePreventive = catchAsync(async (req, res) => {
    const { startDate, endDate } = req.body;
    const options = pick(req.body, ['sortBy', 'sortOrder', 'limit', 'page']);
    const filter = pick(req.body, ['fullName', 'branchs']);
    const { allTotalStatusScheduleAssignUser, scheduleGroups, totalResults } = await reportSchedulePreventiveService.getSummaryReportEngineerPerformanceInSchedulePreventive(startDate, endDate, options, filter, req);
    res.send({
        code: 1,
        ...allTotalStatusScheduleAssignUser,
        totalResults,
        scheduleGroups
    });
});
const getDetailsReportEngineerPerformanceInSchedulePreventive = catchAsync(async (req, res) => {
    const { startDate, endDate } = req.body;
    const options = pick(req.body, ['sortBy', 'sortOrder', 'limit', 'page']);
    const filter = pick(req.body, ['fullName', 'code', 'status', 'branchs']);
    const { allTotalStatusScheduleAssignUser, schedulePreventiveTaskAssignUsers, totalResults } = await reportSchedulePreventiveService.getDetailsReportEngineerPerformanceInSchedulePreventive(startDate, endDate, options, filter, req);
    const _schedulePreventiveTaskAssignUsers = await Promise.all(
        schedulePreventiveTaskAssignUsers.map(async (schedulePreventiveTaskAssignUser) => {
            let totalTimeConsumed = 0;
            let totalPlanningHours = 0;
            if (schedulePreventiveTaskAssignUser.schedulePreventiveTask) {
                totalTimeConsumed = await schedulePreventiveService.totalTimeConsumedSchedulePrevenTask(schedulePreventiveTaskAssignUser.schedulePreventiveTask);
                totalPlanningHours = await schedulePreventiveService.totalPlanningHours(schedulePreventiveTaskAssignUser.schedulePreventiveTask);
            } return {
                ...schedulePreventiveTaskAssignUser,
                id: schedulePreventiveTaskAssignUser._id,
                totalTimeConsumed,
                totalPlanningHours,
            };
        })
    );
    res.send({
        code: 1,
        ...allTotalStatusScheduleAssignUser,
        ...totalResults,
        schedulePreventiveTaskAssignUsers: _schedulePreventiveTaskAssignUsers
    });
});
module.exports = {
    getSumaryProcecssingSattusSchedulePreventive,
    getDetailsProcecssingSattusSchedulePreventive,
    getSummaryReportEngineerPerformanceInSchedulePreventive,
    getDetailsReportEngineerPerformanceInSchedulePreventive,
};
