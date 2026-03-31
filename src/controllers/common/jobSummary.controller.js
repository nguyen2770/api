const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const {
    originService,
    jobSummaryService,
    breakdownAssignUserService,
    breakdownService,
    schedulePreventiveService,
    calibrationWorkService,
} = require('../../services');
const pick = require('../../utils/pick');
const { jobSummarieType, schedulePreventiveTaskAssignUserStatus } = require('../../utils/constant');

/**
 * Create a user
 * @type {(function(*, *, *): void)|*}
 */
const getJobSummary = catchAsync(async (req, res) => {
    const filter = pick(req.body, ['startDate', 'endDate', 'jobType', 'branchs']);
    const options = pick(req.body, ['sortBy', 'limit', 'page', 'sortOrder']);
    const jobSummaries = await jobSummaryService.getJobSummary(filter, options, req);
    const data = await Promise.all(
        jobSummaries?.results?.map(async (item) => {
            if (item.jobType === jobSummarieType.BREAKDOWN) {
                const assignUsers = await breakdownAssignUserService.getBreakdownAssignUserByRes({
                    breakdown: item._id,
                });
                const breakdownDetail = await breakdownService.getBreakdownById(item._id);
                return {
                    ...item,
                    id: item._id,
                    ...breakdownDetail.toObject(),
                    breakdownAssignUsers: assignUsers.map((u) => ({
                        ...u.toObject(),
                        id: u._id,
                    })),
                };
            } else if (item.jobType === jobSummarieType.SCHEDULE_PREVENTIVE) {
                const schedulePreventive = item;
                // Lấy danh sách công việc
                const serviceTasks = await schedulePreventiveService.getSchedulePreventiveTaskByRes({
                    schedulePreventive: schedulePreventive._id,
                });
                if (serviceTasks.length > 0) {
                    const serviceTaskObjs = [];
                    for (let index = 0; index < serviceTasks.length; index++) {
                        const element = serviceTasks[index].toObject();
                        element.taskItems = await schedulePreventiveService.getSchedulePreventiveTaskItemByRes({
                            schedulePreventiveTask: element._id,
                        });
                        element.schedulePreventiveTaskAssignUserIsActive =
                            await schedulePreventiveService.getSchedulePreventiveTaskAssignUserByStatus({
                                schedulePreventiveTask: element._id,
                                status: { $ne: schedulePreventiveTaskAssignUserStatus.replacement },
                            });
                        element.schedulePreventiveTaskAssignUserReplacements =
                            await schedulePreventiveService.getSchedulePreventiveTaskAssignUserByRes({
                                schedulePreventiveTask: element._id,
                                status: schedulePreventiveTaskAssignUserStatus.replacement,
                            });
                        serviceTaskObjs.push(element);
                    }
                    schedulePreventive.schedulePreventiveTasks = serviceTaskObjs;
                } else {
                    schedulePreventive.schedulePreventiveTasks = [];
                }
                // Lấy spare parts
                const schedulePreventiveSpareParts = await schedulePreventiveService.getSchedulePreventiveSparePartByRes({
                    schedulePreventive: schedulePreventive._id,
                });
                schedulePreventive.schedulePreventiveSparePart = schedulePreventiveSpareParts;
                schedulePreventive.totalDownTimeSchedulePreventive =
                    await schedulePreventiveService.totalDownTimeSchedulePreventive(schedulePreventive._id);
                return schedulePreventive;
            } else {
                const serviceObj = item;
                serviceObj.assignUsers = await calibrationWorkService.getCalibrationWorkAssignUserByRes({
                    calibrationWork: serviceObj._id,
                });
                return serviceObj;
            }
        })
    );
    res.send({ code: 1, data, totalResults: jobSummaries?.totalResults });
});

module.exports = {
    getJobSummary,
};
