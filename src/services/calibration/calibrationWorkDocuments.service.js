const httpStatus = require('http-status');
const mongoose = require('mongoose');
const ApiError = require('../../utils/ApiError');
const { CalibrationWorkDocumentsModel } = require('../../models');

const createCalibrationWorkDocument = async (data) => {
    const calibrationWorkDocument = await CalibrationWorkDocumentsModel.create(data);
    return calibrationWorkDocument;
};
const getCalibrationWorkDocumentsByCalibrationWorkId = async (calibrationWorkId) => {
    const calibrationWorkDocuments = await CalibrationWorkDocumentsModel.find({
        calibrationWork: calibrationWorkId,
    }).populate({ path: 'resource' });
    return calibrationWorkDocuments;
};
const deleteCalibrationWorkDocument = async (id) => {
    const calibrationWorkDocument = await CalibrationWorkDocumentsModel.findById(id);
    if (!calibrationWorkDocument) {
        throw new ApiError(httpStatus.NOT_FOUND, 'calibrationWorkDocument not found');
    }
    await calibrationWorkDocument.remove();
    return;
};
module.exports = {
    createCalibrationWorkDocument,
    getCalibrationWorkDocumentsByCalibrationWorkId,
    deleteCalibrationWorkDocument,
};
