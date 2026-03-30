const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const catchAsync = require('../../utils/catchAsync');
const ApiError = require('../../utils/ApiError');
const { calibrationWorkDocumentsService } = require('../../services');
/**
 * Create a user
 * @type {(function(*, *, *): void)|*}
 */
const createCalibrationWorkDocument = catchAsync(async (req, res) => {
    await calibrationWorkDocumentsService.createCalibrationWorkDocument(req?.body);
    res.status(httpStatus.CREATED).send({ code: 1 });
});
const getCalibrationWorkDocumentsByCalibrationWorkId = catchAsync(async (req, res) => {
    const calibrationWorkDocuments = await calibrationWorkDocumentsService.getCalibrationWorkDocumentsByCalibrationWorkId(
        req?.query.calibrationWorkId
    );
    res.status(httpStatus.CREATED).send({ code: 1, calibrationWorkDocuments });
});
const deleteCalibrationWorkDocument =catchAsync(async (req, res) => {
    await calibrationWorkDocumentsService.deleteCalibrationWorkDocument(req?.params?.id);
    res.status(httpStatus.CREATED).send({ code: 1 });
});
module.exports = {
    createCalibrationWorkDocument,
    getCalibrationWorkDocumentsByCalibrationWorkId,
    deleteCalibrationWorkDocument
};
