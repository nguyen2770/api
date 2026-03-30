const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const ApiError = require('../../utils/ApiError');
const catchAsync = require('../../utils/catchAsync');
const { customerService, repairContractService, serviceContractorService } = require('../../services');

const createRepairContract = catchAsync(async (req, res) => {
    const repairContract = {
        ...req.body.repairContract,
        createdBy: req.user.id,
    };
    const _amc = await repairContractService.createRepairContract(
        repairContract,
        req.body.spareParts,
        req.body.listResource
    );
    res.send({ code: 1, data: _amc });
});
const getRepairContracts = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['contractNo', 'contractName', 'serviceContractor', 'customer', 'serviceContractorName', 'customerName', 'startDate', 'endDate', 'searchText']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await repairContractService.getRepairContracts(filter, options);
    // const repairContracts = [];
    // if (result.results.length > 0) {
    //     for (let index = 0; index < result.results.length; index++) {
    //         const element = result.results[index].toObject();
    //         element.customer = await customerService.getCustomerById(element.customer);
    //         element.serviceContractor = await serviceContractorService.getServiceContractorById(element.serviceContractor);
    //         repairContracts.push(element);
    //     }
    // }
    res.send({
        code: 1,
        result,
        // repairContracts,
        // totalResults: result?.totalResults,
        // totalPages: result?.totalPages,
        // page: result?.page,
        // limit: result?.limit,
    });
});
const getRepairContractById = catchAsync(async (req, res) => {
    const repairContract = await repairContractService.getRepairContractById(req.params.id);
    const repairContractWithRes = repairContract.toObject();
    repairContractWithRes.listResource = await repairContractService.getRepairContractAttachments(repairContract?._id);
    repairContractWithRes.repairContractSpareParts = await repairContractService.getRepairContractSpareParts(
        repairContract?._id
    );
    res.send({ code: 1, repairContractWithRes });
});
const deleteRepairContractById = catchAsync(async (req, res) => {
    const repairContract = await repairContractService.deleteRepairContractById(req.params.id);
    res.send({ code: 1, repairContract });
});
const updateRepairContractById = catchAsync(async (req, res) => {
    const calibration = await repairContractService.updateRepairContractById(
        req.body.id,
        req.body.repairContract,
        req.body.spareParts,
        req.body.listResource,
    );
    res.send({ code: 1, calibration });
});
const createRepairContractMappingAssetMaintenance = catchAsync(async (req, res) => {
    const data = {
        ...req.body,
        createdBy: req.user.id,
    };
    const repairContractMappingAssetMaintenance = await repairContractService.createRepairContractMappingAssetMaintenance(data);
    res.send({ code: 1, data: repairContractMappingAssetMaintenance });
});
const deleteRepairContractMappingAssetMaintenancesById = catchAsync(async (req, res) => {
    const repairContract = await repairContractService.deleteRepairContractMappingAssetMaintenancesById(req.params.id);
    res.send({ code: 1, repairContract });
});
const getRepairContractMappingAssetMaintenancesByRes = catchAsync(async (req, res) => {
    const repairContractMappingAssetMaintenances = await repairContractService.getRepairContractMappingAssetMaintenancesByRes(req.body);
    res.send({ code: 1, repairContractMappingAssetMaintenances });
});
const getAllRepairContractByRes = catchAsync(async (req, res) => {
    const repairContracts = await repairContractService.getAllRepairContractByRes(req.body);
    res.send({ code: 1, repairContracts });
});
module.exports = {
    getRepairContracts,
    createRepairContract,
    getRepairContractById,
    deleteRepairContractById,
    updateRepairContractById,
    createRepairContractMappingAssetMaintenance,
    deleteRepairContractMappingAssetMaintenancesById,
    getRepairContractMappingAssetMaintenancesByRes,
    getAllRepairContractByRes
};
