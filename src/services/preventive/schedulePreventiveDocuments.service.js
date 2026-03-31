const httpStatus = require('http-status');
const { Types } = require('mongoose');
const {
    schedulePreventiveService,
    approvalTaskService,
    schedulePrevetiveTaskSparePartRequestService,
    schedulePreventiveDocumentsService,
} = require('..');
const {
    SchedulePrevetiveTaskSparePartRequestModel,
    SchedulePrevetiveTaskSparePartRequestDetailModel,
    SchedulePreventiveTaskAssignUserModel,
    SchedulePreventiveModel,
    ApprovalTaskModel,
    SchedulePreventiveDocumentsModel,
} = require('../../models');
const ApiError = require('../../utils/ApiError');
const {
    schedulePreventiveTaskAssignUserStatus,
    schedulePreventiveTaskRequestSparePartStatus,
    schedulePreventiveStatus,
    schedulePreventiveTaskRequestSparePartDetailStatus,
    approvedTaskType,
} = require('../../utils/constant');

const getSchedulePreventiveDocumentBySchedulePreventive = async (schedulePreventiveId) => {
    const schedulePreventiveDocuments = await SchedulePreventiveDocumentsModel.find({
        schedulePreventive: schedulePreventiveId,
    }).populate({
        path: 'resource',
        populate: [
            {
                path: 'createdBy',
                select: 'fullName'
            }
        ]
    });
    return schedulePreventiveDocuments;
};
const deleteSchedulePreventiveDocumentById = async (id) => {
    const schedulePreventiveDocument = await SchedulePreventiveDocumentsModel.findById(id);
    if (!schedulePreventiveDocument) {
        throw new ApiError(httpStatus.NOT_FOUND, 'schedulePreventiveDocument not found');
    }
    await schedulePreventiveDocument.remove();
    return;
};
const createSchedulePreventiveDocument = async (data) => {
    const schedulePreventiveDocument = await SchedulePreventiveDocumentsModel.create(data);
    return schedulePreventiveDocument;
};
module.exports = {
    getSchedulePreventiveDocumentBySchedulePreventive,
    deleteSchedulePreventiveDocumentById,
    createSchedulePreventiveDocument
};
