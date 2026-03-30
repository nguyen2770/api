const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const catchAsync = require('../../utils/catchAsync');
const ApiError = require('../../utils/ApiError');
const { calibrationService, sequenceService } = require('../../services');

/**
 * Create a user
 * @type {(function(*, *, *): void)|*}
 */
const createCalibration = catchAsync(async (req, res) => {
    const payload = {
        ...req.body.calibration,
        createdBy: req.user.id,
        code: await sequenceService.generateSequenceCode('CALIBRATION'),
    };
    if (!payload.assetMaintenance) {
        throw new ApiError(httpStatus.NOT_FOUND, 'assetMaintenance not found');
    }
    if (!payload.calibrationName) {
        throw new ApiError(httpStatus.NOT_FOUND, 'calibrationName not found');
    }
    if (!payload.numberNext) {
        throw new ApiError(httpStatus.NOT_FOUND, 'numberNext not found');
    }
    if (!payload.dateType) {
        throw new ApiError(httpStatus.NOT_FOUND, 'dateType not found');
    }
    const calibration = await calibrationService.createCalibration(payload);
    res.status(httpStatus.CREATED).send({ code: 1, calibration });
});
const getCalibrations = catchAsync(async (req, res) => {
    const options = pick(req.body, ['sortBy', 'sortOrder', 'limit', 'page']);
    const filter = pick(req.body, [
        'serial',
        'status',
        'code',
        'importance',
        'assetStyle',
        'assetModelName',
        'assetName',
        'calibrationName',
        'searchText',
    ]);
    const { calibrations, totalResults } = await calibrationService.queryCalibrations(filter, options);
    const calibrationWithTasks = await Promise.all(
        calibrations.map(async (calibration) => {
            const serviceObj = calibration;
            serviceObj.assignUsers = await calibrationService.getCalibrationAssignUserByRes({
                calibration: calibration._id,
            });
            return serviceObj;
        })
    );

    res.send({ code: 1, ...totalResults, results: calibrationWithTasks });
});
const deleteCalibrationById = catchAsync(async (req, res) => {
    const calibration = await calibrationService.deleteCalibrationById(req.query.id);
    res.send({ code: 1, calibration });
});
const assignUser = catchAsync(async (req, res) => {
    const _calibration = await calibrationService.createCalibrationAssignUser(req.body);
    res.send({ code: 1, _calibration });
});
const reassignmentUser = catchAsync(async (req, res) => {
    const { user, calibration, oldUser } = req.body;
    const _calibration = await calibrationService.reassignmentUser(user, calibration, oldUser);
    res.send({ code: 1, _calibration });
});
const updateCalibrationById = catchAsync(async (req, res) => {
    const { id, ...payloadUpdate } = req.body;
    const calibration = await calibrationService.updateCalibrationById(id, payloadUpdate);
    res.send({ code: 1, calibration });
});
const getCalibrationById = catchAsync(async (req, res) => {
    const calibration = await calibrationService.getCalibrationById(req.query.id);
    const calibrationContracts = await calibrationService.getCalibrationContractByCalibrations(req.query.id);
    res.send({ code: 1, calibration, calibrationContracts });
});
const startCalibration = catchAsync(async (req, res) => {
    const { id, startDate } = req.body;
    const calibration = await calibrationService.startCalibration(id, startDate);
    res.send({ code: 1, calibration });
});
const stopCalibration = catchAsync(async (req, res) => {
    const { id } = req.body;
    const calibration = await calibrationService.stopCalibration(id);
    res.send({ code: 1, calibration });
});
const changeOfCalibrationContract = catchAsync(async (req, res) => {
    const { id, calibrationContract } = req.body;
    // update  lại dữ liệu
    const calibration = await calibrationService.updateCalibrationById(id, { calibrationContract });
    // cập nhật lại các calibrationWork theo hợp đồng hiệu chuẩn mới - chỉ cập nhật các công việc đang ở trạng thái mới hoặc đang tiến hành
    await calibrationService.updateCalibrationWorkByCalibrationContract(id, calibrationContract);
    res.send({ code: 1, calibration });
});
module.exports = {
    createCalibration,
    getCalibrations,
    deleteCalibrationById,
    assignUser,
    reassignmentUser,
    updateCalibrationById,
    getCalibrationById,
    startCalibration,
    stopCalibration,
    changeOfCalibrationContract,
};
