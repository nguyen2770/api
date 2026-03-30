const httpStatus = require('http-status');
const { ServiceModel, ServiceTaskModel, ServiceTaskItemModel } = require('../../models');
const ApiError = require('../../utils/ApiError');

const createService = async (data) => {
    const service = await ServiceModel.create(data.service);
    if (data.serviceTasks && data.serviceTasks.length > 0) {
        // eslint-disable-next-line no-plusplus
        for (let index = 0; index < data.serviceTasks.length; index++) {
            const element = data.serviceTasks[index];
            element.service = service._id;
            // eslint-disable-next-line no-await-in-loop
            const serviceTask = await ServiceTaskModel.create(element);
            if (element.taskItems && element.taskItems.length > 0) {
                // eslint-disable-next-line no-plusplus
                for (let j = 0; j < element.taskItems.length; j++) {
                    const _item = element.taskItems[j];
                    _item.serviceTask = serviceTask._id;
                    _item.service = service._id;
                    // eslint-disable-next-line no-await-in-loop
                    await ServiceTaskItemModel.create(_item);
                }
            }
        }
    }
    return service;
};
const updateServiceById = async (_id, data) => {
    // eslint-disable-next-line no-use-before-define
    const service = await getServiceById(_id);
    if (!service) {
        throw new ApiError(httpStatus.NOT_FOUND, 'service not found');
    }

    Object.assign(service, data.service);
    // xóa dữ liệu cũ của task detail
    await ServiceTaskModel.deleteMany({ service: _id });
    await ServiceTaskItemModel.deleteMany({ service: _id });
    if (data.serviceTasks && data.serviceTasks.length > 0) {
        // eslint-disable-next-line no-plusplus
        for (let index = 0; index < data.serviceTasks.length; index++) {
            const element = data.serviceTasks[index];
            element.service = service._id;
            // eslint-disable-next-line no-await-in-loop
            const serviceTask = await ServiceTaskModel.create(element);
            if (element.taskItems && element.taskItems.length > 0) {
                // eslint-disable-next-line no-plusplus
                for (let j = 0; j < element.taskItems.length; j++) {
                    const _item = element.taskItems[j];
                    _item.serviceTask = serviceTask._id;
                    _item.service = service._id;
                    // eslint-disable-next-line no-await-in-loop
                    await ServiceTaskItemModel.create(_item);
                }
            }
        }
    }
    await service.save();
    return service;
};

const queryServices = async (filter, options) => {
    // eslint-disable-next-line no-return-await
    const serviceCategories = await ServiceModel.paginate(filter, options);
    return serviceCategories;
};
const getALlServices = async () => {
    // eslint-disable-next-line no-return-await
    const services = await ServiceModel.find();
    return services;
};
const getServiceById = async (id) => {
    return ServiceModel.findById(id);
};
const getServiceTaskByServiceId = async (serviceId) => {
    const serviceTasks = await ServiceTaskModel.find({ service: serviceId });
    return serviceTasks;
};
const getServiceTaskItemByTaskId = async (taskId) => {
    const serviceTaskItems = await ServiceTaskItemModel.find({ serviceTask: taskId });
    return serviceTaskItems;
};
const deleteServiceById = async (id) => {
    const service = await getServiceById(id);
    if (!service) {
        throw new ApiError(httpStatus.NOT_FOUND, 'service not found');
    }
    await ServiceTaskModel.deleteMany({ service: id });
    await ServiceTaskItemModel.deleteMany({ service: id });
    await service.remove();
    return service;
};

const getServiceTaskById = async (id) => {
    const serviceTask = await ServiceTaskModel.findById(id);
    if (!serviceTask) {
        throw new ApiError(httpStatus.NOT_FOUND, 'service task not found');
    }
    const serviceTaskObject = serviceTask.toObject();
    
    serviceTaskObject.taskItems = await getServiceTaskItemByTaskId(serviceTask._id);
    return serviceTaskObject;
};
module.exports = {
    queryServices,
    createService,
    updateServiceById,
    getServiceById,
    deleteServiceById,
    getServiceTaskByServiceId,
    getServiceTaskItemByTaskId,
    getALlServices,
    getServiceTaskById,
};
