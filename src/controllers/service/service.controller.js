const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const ApiError = require('../../utils/ApiError');
const catchAsync = require('../../utils/catchAsync');
const { serviceService } = require('../../services');


const createService = catchAsync(async (req, res) => {
    const payload = {
        service: {
            ...req.body.service,
            createdBy: req.user.id,
            updatedBy: req.user.id,
        },
        serviceTasks: req.body.serviceTasks
    }
    const service = await serviceService.createService(payload);
    res.send({ code: 1, data: service });
});
const updateStatus = catchAsync(async (req, res) => {
    const service = await serviceService.getServiceById(req.params.id);
    if (!service) {
        throw new ApiError(httpStatus.NOT_FOUND, 'service not found');
    }
    const serviceObj = service.toObject();
    const payload = {
        status: !serviceObj.status
    };
    const serviceUpdate = await serviceService.updateServiceById(req.params.id, payload);
    res.send({ code: 1, data: serviceUpdate });
});
const updateService = catchAsync(async (req, res) => {
    const payload = {
        service: {
            ...req.body.service,
            createdBy: req.user.id,
            updatedBy: req.user.id,
        },
        serviceTasks: req.body.serviceTasks
    }
    const service = await serviceService.updateServiceById(req.params.id, payload);
    res.send({ code: 1, data: service });
});
const getServices = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['serviceName']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await serviceService.queryServices(filter, options);
    res.send({ code: 1, data: result });
});
const getAllServices = catchAsync(async (req, res) => {
    const result = await serviceService.getALlServices();
    res.send({ code: 1, data: result });
});
const deleteService = catchAsync(async (req, res) => {
    await serviceService.deleteServiceById(req.params.id);
    res.send({ code: 1 });
});
const getServiceById = catchAsync(async (req, res) => {
    const service = await serviceService.getServiceById(req.params.id);
    const serviceObj = service.toObject();
    if (!serviceObj) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Service not found');
    }
    const serviceTasks = await serviceService.getServiceTaskByServiceId(serviceObj._id);
    if (serviceTasks.length > 0) {
        const serviceTaskObjs = []
        // eslint-disable-next-line no-plusplus
        for (let index = 0; index < serviceTasks.length; index++) {
            const element = serviceTasks[index].toObject();
            // eslint-disable-next-line no-await-in-loop
            element.taskItems = await serviceService.getServiceTaskItemByTaskId(element._id)
            serviceTaskObjs.push(element);
        }
        serviceObj.serviceTasks = serviceTaskObjs;
    } else {
        serviceObj.serviceTasks = []
    }
    res.send({ code: 1, service: serviceObj });
});
module.exports = {
    getServices,
    createService,
    updateStatus,
    updateService,
    deleteService,
    getServiceById,
    getAllServices
};
