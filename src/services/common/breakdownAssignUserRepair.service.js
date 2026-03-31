const { BreakdownAssignUserRepairModel, BreakdownAssignUserAttachmentModel } = require('../../models');


const createBreakdownAssignUserRepair = async (data) => {
    return BreakdownAssignUserRepairModel.create(data);
};
const createBreakdownAssignUserAttachment = async (data) => {
    return BreakdownAssignUserAttachmentModel.create(data);
};
const getBreakdownAssignUserRepairByBreakdownId = async (query) => {
    return BreakdownAssignUserRepairModel.findOne(query);
}
const updateStatus = async (id, data) => {
    const breakdownAssignUser = await BreakdownAssignUserRepairModel.findById(id);
    if (!breakdownAssignUser) {
        throw new Error('breakdownAssignUser not found');
    }
    Object.assign(breakdownAssignUser, data);
    await breakdownAssignUser.save();
    return breakdownAssignUser;
};

const getRepairsByAssignUserIds = async (assignUserIds) => {
    return BreakdownAssignUserRepairModel.find({ breakdownAssignUser: { $in: assignUserIds }, status: true });
};

module.exports = {
    createBreakdownAssignUserRepair,
    getBreakdownAssignUserRepairByBreakdownId,
    updateStatus,
    createBreakdownAssignUserAttachment,
    getRepairsByAssignUserIds
};
