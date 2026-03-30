const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const catchAsync = require('../../utils/catchAsync');
const ApiError = require('../../utils/ApiError');
const { calibrationContractService } = require('../../services');

/**
 * Create a user
 * @type {(function(*, *, *): void)|*}
 */
const createCalibrationContract = catchAsync(async (req, res) => {
    const payload = {
        ...req.body.calibrationContract,
        createdBy: req.user._id,
    };
    const calibrationContract = await calibrationContractService.createCalibrationContract(payload, req.body.listResource);
    res.status(httpStatus.CREATED).send({ code: 1, calibrationContract });
});
const getCalibrationContractById = catchAsync(async (req, res) => {
    const { id } = req.params;
    const calibrationContract = await calibrationContractService.getCalibrationContractById(id);
    const calibrationContractObj = calibrationContract.toObject();
    calibrationContractObj.listResource =
        await calibrationContractService.getCalibrationContractAttachmentsByCalibrationContract(calibrationContract?._id);
    res.send({ code: 1, calibrationContractObj });
});
const getCalibrationContracts = catchAsync(async (req, res) => {
    const filter = pick(req.body, ['state', 'status', 'customer', 'serviceContractor', 'contractNo']);
    const options = pick(req.body, ['sortBy', 'limit', 'page']);
    const resultObj = await calibrationContractService.getCalibrationContracts(filter, options);
    const resultWithItems = await Promise.all(
        resultObj.results?.map(async (item) => {
            const resultObj = item;
            // resultObj.listResource = await calibrationContractService.getCalibrationContractAttachmentsByCalibrationContract(
            //     resultObj?._id
            // );
            return resultObj;
        })
    );
    res.send({
        code: 1,
        resultWithItems,
        totalResults: resultObj?.totalResults,
        page: resultObj?.page,
        limit: resultObj?.limit,
        totalPages: resultObj?.totalPages,
    });
});
const updateCalibrationContract = catchAsync(async (req, res) => {
    const { id, listResource, calibrationContract } = req.body;
    console.log(res.body);
    calibrationContract.updatedBy = req.user.id;
    const update = await calibrationContractService.updateCalibrationContract(id, calibrationContract, listResource);
    res.send({
        code: 1,
        update,
    });
});
const deleteCalibrationContract = catchAsync(async (req, res) => {
    const { id } = req.params;
    const deleteCalibrationContract = await calibrationContractService.deleteCalibrationContract(id);
    res.send({
        code: 1,
        deleteCalibrationContract,
    });
});
const createCalibrationContractMappingAssetMaintenance = catchAsync(async (req, res) => {
    const payload = {
        ...req.body,
        createdBy: req.user._id,
    };
    const calibrationContractMappingAssetMaintenance =
        await calibrationContractService.createCalibrationContractMappingAssetMaintenance(payload);
    res.status(httpStatus.CREATED).send({ code: 1, calibrationContractMappingAssetMaintenance });
});
const deleteCalibrationContractMappingAssetMaintenance = catchAsync(async (req, res) => {
    const { id } = req.params;
    const calibrationContractMappingAssetMaintenance =
        await calibrationContractService.deleteCalibrationContractMappingAssetMaintenance(id);
    res.send({
        code: 1,
        calibrationContractMappingAssetMaintenance,
    });
});
const getCalibrationContractMappingAssetMaintenanceByRes = catchAsync(async (req, res) => {
    const data = req.body;
    const calibrationContractMappingAssetMaintenances =
        await calibrationContractService.getCalibrationContractMappingAssetMaintenanceByRes(data);
    res.send({
        code: 1,
        calibrationContractMappingAssetMaintenances,
    });
});

module.exports = {
    createCalibrationContract,
    getCalibrationContractById,
    getCalibrationContracts,
    updateCalibrationContract,
    deleteCalibrationContract,
    createCalibrationContractMappingAssetMaintenance,
    deleteCalibrationContractMappingAssetMaintenance,
    getCalibrationContractMappingAssetMaintenanceByRes,
};
