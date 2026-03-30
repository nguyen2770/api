const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const pick = require('../../utils/pick');
const { assetMaintenanceCostReportService } = require('../../services');


const getReport = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['startDate', 'endDate']);
    const options = pick(req.query, ['sortBy', 'sortOrder', 'limit', 'page']);
    const results = await assetMaintenanceCostReportService.getReport(filter, options);

    res.send({ code: 1, results: results });
});

module.exports = {
    getReport,
}