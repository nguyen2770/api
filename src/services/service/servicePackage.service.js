const httpStatus = require('http-status');
const { ServicePackageModel, ServicePackageSparePartModel, ServicePackageServiceModel, ServicePackageServiceTaskModel } = require('../../models');
const ApiError = require('../../utils/ApiError');


const createServicePackage = async (_servicePackage, _servicePackageSpareParts, _servicePackageServices) => {
    const servicePackage = await ServicePackageModel.create(_servicePackage);
    if (_servicePackageSpareParts && _servicePackageSpareParts.length > 0) {
        // eslint-disable-next-line no-plusplus
        for (let index = 0; index < _servicePackageSpareParts.length; index++) {
            const element = _servicePackageSpareParts[index];
            element.servicePackage = servicePackage._id;
            // eslint-disable-next-line no-await-in-loop
            const servicePackageTask = await ServicePackageSparePartModel.create(element);
        }
    }
    if (_servicePackageServices && _servicePackageServices.length > 0) {
        // eslint-disable-next-line no-plusplus
        for (let index = 0; index < _servicePackageServices.length; index++) {
            const element = _servicePackageServices[index];
            element.servicePackage = servicePackage._id;
            // eslint-disable-next-line no-await-in-loop
            const servicePackageService = await ServicePackageServiceModel.create(element);
            if (element.servicePackageServiceTasks && element.servicePackageServiceTasks.length > 0) {
                // eslint-disable-next-line no-plusplus
                for (let j = 0; j < element.servicePackageServiceTasks.length; j++) {
                    const _item = element.servicePackageServiceTasks[j];
                    _item.servicePackageService = servicePackageService._id;
                    _item.servicePackage = servicePackage._id;
                    // eslint-disable-next-line no-await-in-loop
                    await ServicePackageServiceTaskModel.create(_item)
                }
            }
        }
    }
    return servicePackage;
};
const updateServicePackageById = async (_id, _servicePackage, _servicePackageSpareParts, _servicePackageServices) => {
    // eslint-disable-next-line no-use-before-define
    const servicePackage = await getServicePackageById(_id);
    if (!servicePackage) {
        throw new ApiError(httpStatus.NOT_FOUND, 'servicePackage not found');
    }

    Object.assign(servicePackage, _servicePackage);
    // xóa dữ liệu cũ của task detail
    await ServicePackageSparePartModel.deleteMany({ servicePackage: _id });
    await ServicePackageServiceModel.deleteMany({ servicePackage: _id });
    await ServicePackageServiceTaskModel.deleteMany({ servicePackage: _id });
    if (_servicePackageSpareParts && _servicePackageSpareParts.length > 0) {
        // eslint-disable-next-line no-plusplus
        for (let index = 0; index < _servicePackageSpareParts.length; index++) {
            const element = _servicePackageSpareParts[index];
            element.servicePackage = servicePackage._id;
            // eslint-disable-next-line no-await-in-loop
            await ServicePackageSparePartModel.create(element);
        }
    }
    if (_servicePackageServices && _servicePackageServices.length > 0) {
        // eslint-disable-next-line no-plusplus
        for (let index = 0; index < _servicePackageServices.length; index++) {
            const element = _servicePackageServices[index];
            element.servicePackage = servicePackage._id;
            // eslint-disable-next-line no-await-in-loop
            const servicePackageService = await ServicePackageServiceModel.create(element);
            if (element.servicePackageServiceTasks && element.servicePackageServiceTasks.length > 0) {
                // eslint-disable-next-line no-plusplus
                for (let j = 0; j < element.servicePackageServiceTasks.length; j++) {
                    const _item = element.servicePackageServiceTasks[j];
                    _item.servicePackageService = servicePackageService._id;
                    _item.servicePackage = servicePackage._id;
                    // eslint-disable-next-line no-await-in-loop
                    await ServicePackageServiceTaskModel.create(_item)
                }
            }
        }
    }
    await servicePackage.save();
    return servicePackage;
};

const queryServicePackages = async (filter, options) => {
    // eslint-disable-next-line no-return-await
    const servicePackageCategories = await ServicePackageModel.paginate(filter, options);
    return servicePackageCategories;
};
const getALlServicePackages = async () => {
    // eslint-disable-next-line no-return-await
    const servicePackages = await ServicePackageModel.find();
    return servicePackages;
};
const getServicePackageById = async (id) => {
    return ServicePackageModel.findById(id);
};
const getServicePackageTaskByServicePackageId = async (servicePackageId) => {
    const servicePackageTasks = await ServicePackageTaskModel.find({ servicePackage: servicePackageId });
    return servicePackageTasks;
}
const getServicePackageTaskItemByTaskId = async (taskId) => {
    const servicePackageTaskItems = await ServicePackageTaskItemModel.find({ servicePackageTask: taskId });
    return servicePackageTaskItems;
}
const deleteServicePackageById = async (id) => {
    const servicePackage = await getServicePackageById(id);
    if (!servicePackage) {
        throw new ApiError(httpStatus.NOT_FOUND, 'servicePackage not found');
    }
    await ServicePackageSparePartModel.deleteMany({ servicePackage: id });
    await ServicePackageServiceModel.deleteMany({ servicePackage: id });
    await ServicePackageServiceTaskModel.deleteMany({ servicePackage: id });
    await servicePackage.remove();
    return servicePackage;
};
const getServicePackageSpareParts = async (servicePackage, havePopulate) => {
    let spartParts = await ServicePackageSparePartModel.find({ servicePackage: servicePackage });
    if (havePopulate) {
        spartParts = await ServicePackageSparePartModel.find({ servicePackage: servicePackage }).populate([{
            path: 'sparePart'
        }]);
    }
    return spartParts;
}
const getServicePackageServices = async (servicePackage) => {
    let servicePackageServices = await ServicePackageServiceModel.find({ servicePackage: servicePackage });
    return servicePackageServices;
}
const getServicePackageServiceTasks = async (query) => {
    let serviceTasks = await ServicePackageServiceTaskModel.find(query);
    return serviceTasks;
}

module.exports = {
    queryServicePackages,
    createServicePackage,
    updateServicePackageById,
    getServicePackageById,
    deleteServicePackageById,
    getServicePackageTaskByServicePackageId,
    getServicePackageTaskItemByTaskId,
    getALlServicePackages,
    getServicePackageSpareParts,
    getServicePackageServices,
    getServicePackageServiceTasks
};
