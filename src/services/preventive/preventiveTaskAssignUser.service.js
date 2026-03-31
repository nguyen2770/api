const httpStatus = require('http-status');
const { PreventiveTaskAssignUserModel, SchedulePreventiveModel, SchedulePreventiveTaskModel, SchedulePreventiveTaskAssignUserModel, PreventiveTaskModel } = require('../../models');
const { schedulePreventiveStatus } = require('../../utils/constant');
const ApiError = require('../../utils/ApiError');

const createPreventiveTaskAssignUser = async (preventiveTaskAssignUser) => {
    return PreventiveTaskAssignUserModel.create(preventiveTaskAssignUser);
};
const preventiveTaskAssignUserByRes = async () => { };

const deletePreventiveTaskAssignUser = async (preventiveTaskId) => {
    return PreventiveTaskAssignUserModel.deleteOne({ preventiveTask: preventiveTaskId });
};
const updateSchedulePreventiveTaskAssignUserByPreventive = async (_preventiveTask, assignUserTask) => {
    const preventiveTask = await PreventiveTaskModel.findById(_preventiveTask);
    if (!preventiveTask) {
        throw new ApiError(httpStatus.NOT_FOUND, 'preventiveTasks not found');
    }
    const schedulePreventives = await SchedulePreventiveModel.find({
        preventive: preventiveTask.preventive,
        status: schedulePreventiveStatus.new,
    }).select('_id');
    const schedulePreventiveIds = schedulePreventives.map((item) => item._id);
    for (const schedulePreventiveId of schedulePreventiveIds) {
        const schedulePreventiveTask = await SchedulePreventiveTaskModel.findOne({ schedulePreventive: schedulePreventiveId, preventiveTask: _preventiveTask, isCancel: false });
        if (schedulePreventiveTask) {
            const schedulePreventiveTaskAssignUsers = await SchedulePreventiveTaskAssignUserModel.find({ schedulePreventiveTask: schedulePreventiveTask._id });
            if (schedulePreventiveTaskAssignUsers && schedulePreventiveTaskAssignUsers.length > 0) {
                continue;
            }
            await SchedulePreventiveTaskAssignUserModel.create({
                schedulePreventive: schedulePreventiveId,
                schedulePreventiveTask: schedulePreventiveTask._id,
                user: assignUserTask
            })
        }
    }

};
module.exports = {
    createPreventiveTaskAssignUser,
    preventiveTaskAssignUserByRes,
    deletePreventiveTaskAssignUser,
    updateSchedulePreventiveTaskAssignUserByPreventive,
};
