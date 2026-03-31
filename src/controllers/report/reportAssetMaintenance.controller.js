const catchAsync = require('../../utils/catchAsync');
const pick = require('../../utils/pick');
const { reportAssetMaintenanceService } = require('../../services');

const getSummaryReportAssetPerformance = catchAsync(async (req, res) => {
    const { startDate, endDate } = req.body;
    const options = pick(req.body, ['sortBy', 'sortOrder', 'limit', 'page']);
    const filter = pick(req.body, ['customerName', 'branchs']);
    const { assetMaintenanceSummarys, totalResults } = await reportAssetMaintenanceService.getSummaryReportAssetPerformance(startDate, endDate, options, filter, req);
    res.send({
        code: 1,
        ...totalResults,
        assetMaintenanceSummarys
    });
});
const getDetailsReportAssetPerformance = catchAsync(async (req, res) => {
    const { startDate, endDate } = req.body;
    const options = pick(req.body, ['sortBy', 'sortOrder', 'limit', 'page']);
    const filter = pick(req.body, ['assetName', 'assetModelName', 'serial', 'assetNumber', 'branchs']);
    const { assetMaintenances, totalResults } = await reportAssetMaintenanceService.getDetailsReportAssetPerformance(startDate, endDate, options, filter, req);
    res.send({
        code: 1,
        ...totalResults,
        assetMaintenances
    });
});
module.exports = {
    getSummaryReportAssetPerformance,
    getDetailsReportAssetPerformance,
};
