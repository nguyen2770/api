const catchAsync = require('../../utils/catchAsync');
const reportBreakdownService = require('../../services/report/reportBreakdown.service');
const pick = require('../../utils/pick');
const { breakdownService } = require('../../services');

const getActivityReportBreakdown = catchAsync(async (req, res) => {
    const { startDate, endDate, reportView } = req.body;
    const options = pick(req.body, ['sortBy', 'sortOrder', 'limit', 'page']);
    const filter = pick(req.body, ['customerName', 'code', 'priorityLevel', 'status', "assetMaintenance", "branch", "filterBy", 'branchs'])
    const data = await reportBreakdownService.getActivityReportBreakdown(startDate, endDate, filter, req);

    const breakdowns = await reportBreakdownService.getListBreakdownActivity(startDate, endDate, options, reportView, filter, req);
    const responseData = {
        ...data,
        breakdowns: [],
        page: 1,
        limit: Number(options.limit) || 10,
        totalPages: 1,
        totalResults: 0
    };

    if (reportView === 'summary') {
        responseData.breakdowns = breakdowns.results;
        responseData.page = breakdowns.page;
        responseData.limit = breakdowns.limit;
        responseData.totalPages = breakdowns.totalPages;
        responseData.totalResults = breakdowns.totalResults;
    } else {
        // breakdowns là paginate, cần tính downtime từng bản ghi
        const breakdownsWithDownTime = await Promise.all(
            breakdowns.results.map(async (breakdown) => {
                const plainBreakdown = breakdown.toObject ? breakdown.toObject() : breakdown;
                return {
                    ...plainBreakdown,
                    id: breakdown._id,
                    downtime: await breakdownService.workingTimeBreakdown(breakdown),
                };
            })
        );
        responseData.breakdowns = breakdownsWithDownTime;
        responseData.page = breakdowns.page;
        responseData.limit = breakdowns.limit;
        responseData.totalPages = breakdowns.totalPages;
        responseData.totalResults = breakdowns.totalResults;
    }

    res.send({
        code: 1,
        data: responseData
    });
});
const getDetailsReportEngineerPerformanceInBreakdown = catchAsync(async (req, res) => {
    const { startDate, endDate } = req.body;
    const options = pick(req.body, ['sortBy', 'sortOrder', 'limit', 'page']);
    const filter = pick(req.body, ['fullName', 'code', 'status', 'branchs'])
    const { allBreakdownAssignUserStatus, breakdownAssignUsers, totalResults } = await reportBreakdownService.getDetailsReportEngineerPerformanceInBreakdown(startDate, endDate, options, filter, req);
    const _breakdownAssignUsers = await Promise.all(
        breakdownAssignUsers.map(async (breakdownAssignUser) => {
            const totalTimeCosumed = await breakdownService.totalTimeCosumed(breakdownAssignUser._id)
            return {
                ...breakdownAssignUser,
                id: breakdownAssignUser._id,
                totalTimeCosumed
            };
        })
    );
    res.send({
        code: 1,
        ...allBreakdownAssignUserStatus,
        ...totalResults,
        breakdownAssignUsers: _breakdownAssignUsers
    });
});
const getSummaryReportEngineerPerformanceInBreakdown = catchAsync(async (req, res) => {
    const { startDate, endDate } = req.body;
    const options = pick(req.body, ['sortBy', 'sortOrder', 'limit', 'page']);
    const filter = pick(req.body, ['fullName', 'branchs']);
    const { allBreakdownAssignUserStatus, breakdownAssignUsers, totalResults } = await reportBreakdownService.getSummaryReportEngineerPerformanceInBreakdown(startDate, endDate, options, filter, req);
    res.send({
        code: 1,
        ...allBreakdownAssignUserStatus,
        ...totalResults,
        breakdownAssignUsers
    });
});
module.exports = {
    getActivityReportBreakdown,
    getDetailsReportEngineerPerformanceInBreakdown,
    getSummaryReportEngineerPerformanceInBreakdown,

};
