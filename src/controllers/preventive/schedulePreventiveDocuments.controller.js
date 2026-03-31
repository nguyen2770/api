const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const catchAsync = require('../../utils/catchAsync');
const { schedulePreventiveDocumentsService } = require('../../services');
const ApiError = require('../../utils/ApiError');
/**
 * Create a user
 * @type {(function(*, *, *): void)|*}
 */
const getSchedulePreventiveDocumentBySchedulePreventive = catchAsync(async (req, res) => {
    const { schedulePreventive } = req.body;
    const schedulePreventiveDocuments =
        await schedulePreventiveDocumentsService.getSchedulePreventiveDocumentBySchedulePreventive(schedulePreventive);
    res.status(httpStatus.CREATED).send({ code: 1, schedulePreventiveDocuments });
});
const deleteSchedulePreventiveDocumentById = catchAsync(async (req, res) => {
    await schedulePreventiveDocumentsService.deleteSchedulePreventiveDocumentById(req.params.id);
    res.status(httpStatus.CREATED).send({ code: 1 });
});
const createSchedulePreventiveDocument = catchAsync(async (req, res) => {
    await schedulePreventiveDocumentsService.createSchedulePreventiveDocument(req.body);
    res.status(httpStatus.CREATED).send({ code: 1 });
});
module.exports = {
    getSchedulePreventiveDocumentBySchedulePreventive,
    deleteSchedulePreventiveDocumentById,
    createSchedulePreventiveDocument
};
