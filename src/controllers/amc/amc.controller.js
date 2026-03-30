const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const ApiError = require('../../utils/ApiError');
const catchAsync = require('../../utils/catchAsync');
const { amcService, serviceService, customerService, servicePackageService, sparePartsService } = require('../../services');

const createAmc = catchAsync(async (req, res) => {
    const amc = {
        ...req.body.amc,
        createdBy: req.user.id,
        updatedBy: req.user.id,
    };
    const _amc = await amcService.createAmc(amc, req.body.amcSpareParts, req.body.amcServices, req.body.listResource);
    res.send({ code: 1, data: _amc });
});
const updateStatus = catchAsync(async (req, res) => {
    const amcUpdate = await amcService.updateStatus(req.params.id);
    res.send({ code: 1, data: amcUpdate });
});
const updateAmc = catchAsync(async (req, res) => {
    const amc = {
        ...req.body.amc,
        createdBy: req.user.id,
        updatedBy: req.user.id,
    };
    const _amc = await amcService.updateAmcById(
        req.params.id,
        amc,
        req.body.amcSpareParts,
        req.body.amcServices,
        req.body.listResource
    );
    res.send({ code: 1, data: _amc });
});
const getAmcs = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['amcNo']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await amcService.queryAmcs(filter, options);
    const amcs = [];
    if (result.results.length > 0) {
        for (let index = 0; index < result.results.length; index++) {
            const element = result.results[index].toObject();
            element.customer = await customerService.getCustomerById(element.customer);
            amcs.push(element);
        }
    }
    res.send({ code: 1, data: result, amcs });
});
const getAllAmcs = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['customer']);
    const result = await amcService.getALlAmcs(filter);
    res.send({ code: 1, data: result });
});
const deleteAmc = catchAsync(async (req, res) => {
    await amcService.deleteAmcById(req.params.id);
    res.send({ code: 1 });
});
const getAmcById = catchAsync(async (req, res) => {
    const amc = await amcService.getAmcById(req.params.id);
    const amcObj = amc.toObject();
    if (!amcObj) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Service package not found');
    }
    const amcSpareParts = await amcService.getAmcSpareParts(amcObj._id, req.query.havePopulate);
    const amcResources = await amcService.getAmcAttachments(amcObj._id, req.query.havePopulate);
    const amcServices = await amcService.getAmcServices(amcObj._id);
    const _amcServices = [];
    if (amcServices.length > 0) {
        // eslint-disable-next-line no-plusplus
        for (let index = 0; index < amcServices.length; index++) {
            const element = amcServices[index].toObject();
            // eslint-disable-next-line no-await-in-loop
            element.amcServiceTasks = await amcService.getAmcServiceTasks({ amcService: element._id });
            const service = await serviceService.getServiceById(element.service);
            const serviceTasks = await serviceService.getServiceTaskByServiceId(element.service);
            element.service = {
                ...service.toObject(),
                serviceTasks,
            };
            _amcServices.push(element);
        }
    }
    const customer = await customerService.getCustomerById(amc.customer);
    const serviceContractor = await amcService.getServiceContractorById(amc.serviceContractor);
    const servicePackage = await servicePackageService.getServicePackageById(amc.servicePackage);
    res.send({
        code: 1,
        amc: amcObj,
        customer,
        servicePackage,
        amcSpareParts,
        amcServices: _amcServices,
        amcResources,
        serviceContractor,
    });
});
const totalAmcByState = catchAsync(async (req, res) => {
    const data = await amcService.totalAmcByState();
    res.send({ code: 1, data });
});
const getAmcMappingAssetMaintenanceByRes = catchAsync(async (req, res) => {
    console.log();
    const data = await amcService.getAmcMappingAssetMaintenanceByRes({ ...req.body });
    res.send({ code: 1, data });
});
const createAmcMappingAssetMaintenance = catchAsync(async (req, res) => {
    const data = await amcService.createAmcMappingAssetMaintenance({ createdBy: req.user.id, ...req.body });
    res.send({ code: 1, data });
});
const deleteAmcMappingAssetMaintenance = catchAsync(async (req, res) => {
    const data = await amcService.deleteAmcMappingAssetMaintenance(req.params.id);
    res.send({ code: 1, data });
});
const getAmcServiceTasksByAmc = catchAsync(async (req, res) => {
    const amcServiceTasks = await amcService.getAmcServiceTasksByAmc(req.body.amc);
    const amcServiceTasksWithserviceTaskItems = await Promise.all(
        amcServiceTasks.map(async (data) => {
            const amcServiceTaskObject = data.toObject();
            const serviceTask = await serviceService.getServiceTaskById(amcServiceTaskObject.serviceTask);
            return {
                ...amcServiceTaskObject,
                //  amc: amcServiceTaskObject.amc,
                ...serviceTask,
            };
        })
    );
    const amcSparePartByAmc = await amcService.getAmcSparePartByAmc(req.body.amc);

    const amcSparePartByAmcWithSpareParts = await Promise.all(
        amcSparePartByAmc.map(async (data) => {
            const amcSparePartObject = data.toObject ? data.toObject() : data;
            const sparePart = await sparePartsService.getSparePartByIdNotPopulate(amcSparePartObject.sparePart);
            return {
                amc: amcSparePartObject.amc,
                ...(sparePart?.toObject ? sparePart.toObject() : sparePart),
            };
        })
    );
    res.send({ code: 1, amcServiceTasksWithserviceTaskItems, amcSparePartByAmcWithSpareParts });
});
module.exports = {
    getAmcs,
    createAmc,
    updateStatus,
    updateAmc,
    deleteAmc,
    getAmcById,
    getAllAmcs,
    totalAmcByState,
    getAmcMappingAssetMaintenanceByRes,
    createAmcMappingAssetMaintenance,
    deleteAmcMappingAssetMaintenance,
    getAmcServiceTasksByAmc,
};
