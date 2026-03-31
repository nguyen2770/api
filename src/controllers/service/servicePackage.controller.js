const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const ApiError = require('../../utils/ApiError');
const catchAsync = require('../../utils/catchAsync');
const { servicePackageService, serviceService } = require('../../services');


const createServicePackage = catchAsync(async (req, res) => {
    const servicePackage = {
        ...req.body.servicePackage,
        createdBy: req.user.id,
        updatedBy: req.user.id,
    }
    const _servicePackage = await servicePackageService.createServicePackage(servicePackage, req.body.servicePackageSpareParts, req.body.servicePackageServices);
    res.send({ code: 1, data: _servicePackage });
});
const updateStatus = catchAsync(async (req, res) => {
    const servicePackageUpdate = await servicePackageService.updateStatus(req.params.id);
    res.send({ code: 1, data: servicePackageUpdate });
});
const updateServicePackage = catchAsync(async (req, res) => {
    const servicePackage = {
        ...req.body.servicePackage,
        createdBy: req.user.id,
        updatedBy: req.user.id,
    }
    const _servicePackage = await servicePackageService.updateServicePackageById(req.params.id, servicePackage, req.body.servicePackageSpareParts, req.body.servicePackageServices);
    res.send({ code: 1, data: _servicePackage });
});
const getServicePackages = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['servicePackageCode', 'servicePackageName']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await servicePackageService.queryServicePackages(filter, options);
    res.send({ code: 1, data: result });
});
const getAllServicePackages = catchAsync(async (req, res) => {
    const result = await servicePackageService.getALlServicePackages();
    res.send({ code: 1, data: result });
});
const deleteServicePackage = catchAsync(async (req, res) => {
    await servicePackageService.deleteServicePackageById(req.params.id);
    res.send({ code: 1 });
});
const getServicePackageById = catchAsync(async (req, res) => {
    const servicePackage = await servicePackageService.getServicePackageById(req.params.id);
    const servicePackageObj = servicePackage.toObject();
    if (!servicePackageObj) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Service package not found');
    }
    const servicePackageSpareParts = await servicePackageService.getServicePackageSpareParts(servicePackageObj._id, req.query.havePopulate);
    const servicePackageServices = await servicePackageService.getServicePackageServices(servicePackageObj._id);
    const _servicePackageServices = [];
    if (servicePackageServices.length > 0) {
        // eslint-disable-next-line no-plusplus
        for (let index = 0; index < servicePackageServices.length; index++) {
            const element = servicePackageServices[index].toObject();
            // eslint-disable-next-line no-await-in-loop
            element.servicePackageServiceTasks = await servicePackageService.getServicePackageServiceTasks({ servicePackageService: element._id })
            const service = await serviceService.getServiceById(element.service);
            const serviceTasks = await serviceService.getServiceTaskByServiceId(element.service);
            element.service = {
                ...service.toObject(),
                serviceTasks
            };
            _servicePackageServices.push(element);
        }
    }
    res.send({ code: 1, servicePackage: servicePackageObj, servicePackageSpareParts, servicePackageServices: _servicePackageServices });
});
const detailServicePackage = catchAsync(async (req, res) => {
    const servicePackage = await servicePackageService.getServicePackageById(req.params.id);
    const servicePackageObj = servicePackage.toObject();
    if (!servicePackageObj) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Service package not found');
    }
    const servicePackageSpareParts = await servicePackageService.getServicePackageSpareParts(servicePackageObj._id, req.query.havePopulate);
    const servicePackageServices = await servicePackageService.getServicePackageServices(servicePackageObj._id);
    const _servicePackageServices = [];
    if (servicePackageServices.length > 0) {
        // eslint-disable-next-line no-plusplus
        for (let index = 0; index < servicePackageServices.length; index++) {
            const element = servicePackageServices[index].toObject();
            // eslint-disable-next-line no-await-in-loop
            element.servicePackageServiceTasks = await servicePackageService.getServicePackageServiceTasks({ servicePackageService: element._id })
            const service = await serviceService.getServiceById(element.service);
            const serviceTasks = await serviceService.getServiceTaskByServiceId(element.service);
            element.service = {
                ...service.toObject(),
                serviceTasks
            };
            _servicePackageServices.push(element);
        }
    }
    res.send({ code: 1, servicePackage: servicePackageObj, servicePackageSpareParts, servicePackageServices: _servicePackageServices });
});
module.exports = {
    getServicePackages,
    createServicePackage,
    updateStatus,
    updateServicePackage,
    deleteServicePackage,
    getServicePackageById,
    getAllServicePackages,
    detailServicePackage
};
