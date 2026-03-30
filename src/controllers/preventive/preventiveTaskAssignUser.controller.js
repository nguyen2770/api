const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const { preventiveTaskAssignUserService } = require('../../services');
/**
 * Create a user
 * @type {(function(*, *, *): void)|*}
 */
const createPreventiveTaskAssignUser = catchAsync(async (req, res) => {
    const { preventiveTaskAssignUser } = req.body;
    // preventiveTaskAssignUser.createdBy = req.user.id;
    if (preventiveTaskAssignUser.preventiveTask) {
        await preventiveTaskAssignUserService.deletePreventiveTaskAssignUser(preventiveTaskAssignUser.preventiveTask);
    }
    const _preventiveTaskAssignUser = await preventiveTaskAssignUserService.createPreventiveTaskAssignUser(preventiveTaskAssignUser);
    // cập nhật lại được luôn schedulePreventiveAssignUser
    await preventiveTaskAssignUserService.updateSchedulePreventiveTaskAssignUserByPreventive(preventiveTaskAssignUser.preventiveTask, preventiveTaskAssignUser.user)
    res.status(httpStatus.CREATED).send({ code: 1, _preventiveTaskAssignUser });
});

module.exports = {
    createPreventiveTaskAssignUser,
};
