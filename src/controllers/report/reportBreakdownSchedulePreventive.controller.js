const catchAsync = require('../../utils/catchAsync');
const pick = require('../../utils/pick');
const { reportBreakdownSchedulePreventiveService } = require('../../services');

const getReportAssetMaintenanceRequest = catchAsync(async (req, res) => {
    const { startDate, endDate } = req.body;
    const options = pick(req.body, ['sortBy', 'sortOrder', 'limit', 'page']);
    const filter = pick(req.body, ['code', 'type', 'priority', 'preventiveName', 'status', 'branchs']);
    const data = await reportBreakdownSchedulePreventiveService.getReportAssetMaintenanceRequest(startDate, endDate, options, filter, req);
    res.send({
        code: 1,
        ...data
    });
});

module.exports = {
    getReportAssetMaintenanceRequest,

};
