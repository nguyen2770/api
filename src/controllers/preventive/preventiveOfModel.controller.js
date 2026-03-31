const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const catchAsync = require('../../utils/catchAsync');
const { preventiveOfModelService, preventiveService, } = require('../../services');
const assetModelMonitoringPointService = require('../../services/assets/assetModelMonitoringPoint.service');
/**
 * Create a user
 * @type {(function(*, *, *): void)|*}
 */
const createPreventiveOfModel = catchAsync(async (req, res) => {
    const payload = {
        preventiveOfModel: {
            ...req.body.preventiveOfModel,
            createdBy: req.user.id,
        },
        preventiveOfModelSpareParts: req.body.preventiveOfModelSpareParts,
        preventiveOfModelTasks: req.body.preventiveOfModelTasks,
        preventiveOfModelConditionBaseds: req.body.preventiveOfModelConditionBaseds,
    };

    const preventiveOfModel = await preventiveOfModelService.createPreventiveOfModel(payload);
    res.status(httpStatus.CREATED).send({ code: 1, preventiveOfModel });
});
const queryPreventiveOfModels = catchAsync(async (req, res) => {
    const filter = pick(req.body, ['assetModel']);
    const queryPreventiveOfModels = await preventiveOfModelService.queryPreventiveOfModels(filter);
    const preventiveOfModelWithTasks = await Promise.all(
        queryPreventiveOfModels.map(async (preventive) => {
            const serviceObj = preventive;
            // Lấy danh sách công việc
            const serviceTasks = await preventiveOfModelService.getPreventiveOfModelTaskByRes({
                preventiveOfModel: serviceObj._id,
            });
            if (serviceTasks.length > 0) {
                const serviceTaskObjs = [];
                for (let index = 0; index < serviceTasks.length; index++) {
                    const element = serviceTasks[index].toObject();
                    element.taskItems = await preventiveOfModelService.getPreventiveOfModelTaskItemByRes({
                        preventiveOfModelTask: element._id,
                    });
                    serviceTaskObjs.push(element);
                }
                serviceObj.preventiveOfModelTasks = serviceTaskObjs;
            } else {
                serviceObj.preventiveTasks = [];
            }
            // Lấy spare parts
            const preventiveSpareParts = await preventiveOfModelService.getPreventiveOfModelSaprePartByRes({
                preventiveOfModel: serviceObj._id,
            });
            // const preventives = await preventiveService.queryPreventives(
            //     pick(req.body, ['branchs']), 
            //     {
            //         page:
            //     }, 
            //     req);
            serviceObj.preventiveOfModelSparePart = preventiveSpareParts;
            return serviceObj;
        })
    );
    res.send({ code: 1, preventiveOfModelWithTasks });
});
const getPreventiveOfModelById = catchAsync(async (req, res) => {
    const preventiveOfModel = await preventiveOfModelService.getPreventiveOfModelById(req.query.id);
    const serviceObj = preventiveOfModel.toObject();
    const serviceTasks = await preventiveOfModelService.getPreventiveOfModelTaskByRes({ preventiveOfModel: serviceObj._id });
    if (serviceTasks.length > 0) {
        const serviceTaskObjs = [];
        // eslint-disable-next-line no-plusplus
        for (let index = 0; index < serviceTasks.length; index++) {
            const element = serviceTasks[index].toObject();
            // eslint-disable-next-line no-await-in-loop
            element.taskItems = await preventiveOfModelService.getPreventiveOfModelTaskItemByRes({
                preventiveOfModelTask: element._id,
            });
            serviceTaskObjs.push(element);
        }
        serviceObj.preventiveOfModelTasks = serviceTaskObjs;
    } else {
        serviceObj.preventiveOfModelTasks = [];
    }
    const preventiveOfModelSpareParts = await preventiveOfModelService.getPreventiveOfModelSaprePartByRes({
        preventiveOfModel: serviceObj._id,
    });
    const preventiveOfModelConditionBaseds = await preventiveOfModelService.getPreventiveOfModelConditionBasedByRes({
        preventiveOfModel: serviceObj._id,
    });
    serviceObj.preventiveOfModelSpareParts = preventiveOfModelSpareParts; // Thêm dòng này
    serviceObj.preventiveOfModelConditionBaseds = preventiveOfModelConditionBaseds;
    res.send({ code: 1, data: serviceObj });
});
const updatePreventiveOfModelById = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body.data;
    const updated = await preventiveOfModelService.updatePreventiveOfModelById(id, updateData, req.user.id);
    res.send({ code: 1, data: updated });
});
const deletePreventiveOfModelById = catchAsync(async (req, res) => {
    await preventiveOfModelService.deletePreventiveOfModelById(req.query.id);
    res.status(httpStatus.OK).send({ code: 1 });
});
const startPreventiveByPreventiveOfModel = catchAsync(async (req, res) => {
    const { assetMaintenance, preventiveOfModel, actualScheduleDate, initialValue } = req.body.data;
    await preventiveOfModelService.startPreventiveByPreventiveOfModel(
        preventiveOfModel,
        assetMaintenance,
        req.user.id,
        actualScheduleDate,
        initialValue
    );
    res.status(httpStatus.OK).send({ code: 1 });
});
const startManyPreventiveByPreventiveOfModel = catchAsync(async (req, res) => {
    const { assetMaintenances, preventiveOfModel, actualScheduleDate, initialValue } = req.body.data;
    for (const assetMaintenance of assetMaintenances) {
        await preventiveOfModelService.startPreventiveByPreventiveOfModel(
            preventiveOfModel,
            assetMaintenance,
            req.user.id,
            actualScheduleDate,
            initialValue
        );
    }
    res.status(httpStatus.OK).send({ code: 1 });
});
const stopPreventiveByPreventiveOfModel = catchAsync(async (req, res) => {
    const { assetMaintenance, preventiveOfModel } = req.body.data;
    await preventiveOfModelService.stopPreventiveByPreventiveOfModel(preventiveOfModel, assetMaintenance, req.user.id);
    res.status(httpStatus.OK).send({ code: 1 });
});
const getTotalPreventiveByPreventiveOfModel = catchAsync(async (req, res) => {
    const countPrevetive = await preventiveOfModelService.getTotalPreventiveByPreventiveOfModel(
        req.query.preventiveOfModel,
        req.query.assetMaintenance,
    );
    res.status(httpStatus.OK).send({ code: 1, countPrevetive });
});

module.exports = {
    createPreventiveOfModel,
    queryPreventiveOfModels,
    getPreventiveOfModelById,
    updatePreventiveOfModelById,
    deletePreventiveOfModelById,
    startPreventiveByPreventiveOfModel,
    stopPreventiveByPreventiveOfModel,
    getTotalPreventiveByPreventiveOfModel,
    startManyPreventiveByPreventiveOfModel,
};
