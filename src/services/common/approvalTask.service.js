const { Types } = require("mongoose");
const { ApprovalTaskModel, Breakdown, SchedulePreventiveModel, CalibrationWorkModel, Department, AssetMaintenance } = require("../../models")


// const queryApprovalTask = async (filter, options) => {
//     const res = await ApprovalTaskModel.paginate(filter, options);
//     return res;
// };
const queryApprovalTask = async (filter, options, req) => {
    // kiểm tra xem có được xem tất cả tài sản không
    let allowViewAll = true;
    if (req.companySetting.filterByAccount) {
        const dep = await Department.findById(req.user.department).select('allowViewAll');
        allowViewAll = dep?.allowViewAll;
    }
    const amQuery = {};
    if (filter.branchs && Array.isArray(filter.branchs) && filter.branchs.length > 0) {
        amQuery.branch = { $in: filter.branchs.map(id => Types.ObjectId(id)) };
        delete filter.branchs;
    }
    if (!allowViewAll) {
        amQuery.department = Types.ObjectId(req?.user?.department);
    }

    if (Object.keys(amQuery).length > 0) {
        const validAssetMaintenances = await AssetMaintenance.find(amQuery).select('_id');
        const amIds = validAssetMaintenances.map(asset => asset._id);

        console.log(amIds);
        const [validBreakdowns, validSchedules, validCalibrations] = await Promise.all([
            Breakdown.find({ assetMaintenance: { $in: amIds } }).select('_id'),
            SchedulePreventiveModel.find({ assetMaintenance: { $in: amIds } }).select('_id'),
            CalibrationWorkModel.find({ assetMaintenance: { $in: amIds } }).select('_id')
        ]);

        const breakdownIds = validBreakdowns.map(b => b._id);
        const scheduleIds = validSchedules.map(s => s._id);
        const calibrationWorkIds = validCalibrations.map(c => c._id);

        const departmentFilter = {
            $or: [
                // { 'data.assetMaintenance': { $in: amIds } },
                // { 'data.preventive.assetMaintenance': { $in: amIds } },
                // { 'data.assetMaintenance._id': { $in: amIds } },
                // { 'data.breakdown.id': { $in: breakdownIds } },

                { 'data.id': { $in: breakdownIds } },
                { 'data._id': { $in: scheduleIds } },
                { 'data._id': { $in: calibrationWorkIds } },

                { sourceId: { $in: scheduleIds } },
                { sourceId: { $in: breakdownIds } },
                { sourceId: { $in: calibrationWorkIds } },
            ]
        };
        if (Object.keys(filter).length > 0) {
            filter = { $and: [filter, departmentFilter] };
        } else {
            filter = departmentFilter;
        }
    }
    const res = await ApprovalTaskModel.paginate(filter, options);
    return res;
};

const createApprovalTask = async (payload) => {
    const res = await ApprovalTaskModel.create(payload);
    return res;
};

const updateApprovalTask = async (id, payload) => {
    const res = await ApprovalTaskModel.findByIdAndUpdate(id, payload);
    return res;
};


const updateApprovalTaskBySourceId = async (id, payload) => {
    const res = await ApprovalTaskModel.findOneAndUpdate(
        { sourceId: id },
        { $set: payload },
        { new: true }
    );

    return res;
};
module.exports = {
    queryApprovalTask,
    createApprovalTask,
    updateApprovalTask,
    updateApprovalTaskBySourceId,
};