const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const catchAsync = require('../../utils/catchAsync');
const { preventiveMonitoringService, preventiveService } = require('../../services');

// const getPreventiveMonitorings = catchAsync(async (req, res) => {
//     const filter = pick(req.body, ['monitoringPointName', 'code']);
//     const options = pick(req.body, ['sortBy', 'limit', 'page']);
//     const preventiveMonitorings = await preventiveMonitoringService.getPreventiveMonitorings(filter, options, req.user.id);
//     const preventiveMonitoringsWithDetails = await Promise.all(
//         preventiveMonitorings.results.map(async (preventiveMonitoring) => {
//             const monitoringObj = preventiveMonitoring;
//             // Lấy danh sách lịch sử
//             const monitoringHistorie = await preventiveMonitoringService.getLastPreventiveMonitoringHistoryByRes({
//                 preventiveMonitoring: monitoringObj._id,
//             });
//             return { ...monitoringObj.toObject(), monitoringHistoryLast: monitoringHistorie };
//         })
//     );
//     res.send({
//         code: 1,
//         results: preventiveMonitoringsWithDetails,
//         totalResults: preventiveMonitorings.totalResults,
//     });
// });
const getPreventiveMonitorings = catchAsync(async (req, res) => {
    const filter = pick(req.body, ['monitoringPointName', 'code']);
    const options = pick(req.body, ['sortBy', 'limit', 'page']);

    // get monitoring records (paginated)
    const preventiveMonitorings = await preventiveMonitoringService.getPreventiveMonitorings(filter, options, req.user.id);
    const monitoringItems = await Promise.all(
        (preventiveMonitorings.results || []).map(async (preventiveMonitoring) => {
            const monitoringObj = preventiveMonitoring;
            const monitoringHistorie = await preventiveMonitoringService.getLastPreventiveMonitoringHistoryByRes({
                preventiveMonitoring: monitoringObj._id,
            });
            return { ...monitoringObj.toObject(), monitoringHistoryLast: monitoringHistorie, _source: 'monitoring' };
        })
    );

    // get condition-based preventives (paginated)
    const { results: conditionResults } = await preventiveService.getPreventiveByConditionBasedSchedule(filter, options, req.user.id);
    const preventiveItems = await Promise.all(
        (conditionResults || []).map(async (preventive) => {
            const serviceObj = preventive.toObject ? preventive.toObject() : { ...preventive };
            const preventiveConditionBaseds = await preventiveService.getAllPreventiveConditionBasedSchedule(serviceObj._id);
            return { preventive: serviceObj, preventiveConditionBaseds, _source: 'preventive' };
        })
    );

    // combine lists (you can change merge strategy if needed: dedupe, prioritize, etc.)
    const combined = [...monitoringItems, ...preventiveItems];

    // simple pagination on combined list
    const page = parseInt(options.page, 10) || 1;
    const limit = parseInt(options.limit, 10) || 10;
    const start = (page - 1) * limit;
    const pagedResults = combined.slice(start, start + limit);

    res.send({
        code: 1,
        results: pagedResults,
        totalResults: combined.length,
        sourceTotals: {
            monitoringTotal: preventiveMonitorings.totalResults || (preventiveMonitorings.totalResults === 0 ? 0 : preventiveMonitorings.results?.length || 0),
            conditionPreventiveTotal: (conditionResults && conditionResults.length) || 0,
        },
    });
});
const updatePreventiveMonitoringById = catchAsync(async (req, res) => {
    const preventiveMonitoring = await preventiveMonitoringService.updatePreventiveMonitoringById(req.params.id, req.body);
    await preventiveMonitoringService.generateSchedulePrenventiveByPreventiveMonitoring(preventiveMonitoring._id, req.user.id)
    res.status(httpStatus.OK).send({ code: 1, data: preventiveMonitoring });
});
const getPreventiveMonitoringHistorys = catchAsync(async (req, res) => {
    const filter = pick(req.body, ['preventiveMonitoring']);
    const preventiveMonitoringHistorys = await preventiveMonitoringService.getPreventiveMonitoringHistoryByRess(filter);
    res.status(httpStatus.OK).send({ code: 1, data: preventiveMonitoringHistorys });
});
module.exports = {
    getPreventiveMonitorings,
    updatePreventiveMonitoringById,
    getPreventiveMonitoringHistorys,
};
