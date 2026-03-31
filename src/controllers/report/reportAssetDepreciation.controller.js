const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const { reportAssetDepreciationService } = require('../../services');
const ApiError = require('../../utils/ApiError');
const pick = require('../../utils/pick');

const getAssetDepreciationReport = catchAsync(async (req, res) => {
    const options = pick(req.body, ['sortBy', 'limit', 'page']);
    const filter = pick(req.body, ['assetName', 'serial', 'reportCutoffDate', 'assetIds', 'branchs']);
    const { reports, totalPages, totalResults, page, limit } = await reportAssetDepreciationService.getAssetDepreciationReport(filter, options, req);
    res.send({
        code: 1,
        reports,
        page,
        limit,
        totalPages,
        totalResults,
    });
});

const getDetailAssetDepreciationReport = catchAsync(async (req, res) => {
    const options = pick(req.body, ['sortBy', 'limit', 'page']);
    const filter = pick(req.body, ['assetName', 'serial', 'reportCutoffYear', 'assetIds', 'branchs']);
    const { reports, totalPages, totalResults, page, limit } = await reportAssetDepreciationService.getDetailAssetDepreciationReport(filter, options, req);
    res.send({
        code: 1,
        reports,
        page,
        limit,
        totalPages,
        totalResults,
    });
});

const getFullAssetDepreciationReport = catchAsync(async (req, res) => {
    const options = pick(req.body, ['sortBy', 'limit', 'page']);
    const filter = pick(req.body, ['assetName', 'serial', 'reportCutoffYear', 'reportCutoffDate', 'assetIds', 'branchs']);
    const [resA, resB] = await Promise.all([
        reportAssetDepreciationService.getAssetDepreciationReport(filter, options, req),
        reportAssetDepreciationService.getDetailAssetDepreciationReport(filter, options, req),
    ]);
    const map = new Map();
    resA.reports.forEach(item => {
        map.set(item._id.toString(), { ...item });
    });
    resB.reports.forEach(item => {
        const key = item._id.toString();
        if (map.has(key)) {
            map.set(key, { ...map.get(key), ...item });
        } else {
            map.set(key, { ...item });
        }
    })
    const mergeData = Array.from(map.values());
    res.send({
        code: 1,
        data: mergeData,
        total: mergeData.length,
    });
});


module.exports = {
    getAssetDepreciationReport,
    getDetailAssetDepreciationReport,
    getFullAssetDepreciationReport,
}