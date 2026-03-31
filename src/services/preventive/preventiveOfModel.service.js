const mongoose = require('mongoose');
const {
    PreventiveOfModelModel,
    PreventiveOfModelTaskModel,
    PreventiveOfModelSparePartModel,
    PreventiveOfModelTaskItemModel,
    PreventiveModel,
    PreventiveTaskModel,
    PreventiveTaskItemModel,
    PreventiveSparePartModel,
    PreventiveOfModelConditionBasedModel,
    PreventiveConditionBasedModel,
    PreventiveMonitoringModel,
} = require('../../models');
const ApiError = require('../../utils/ApiError');
const httpStatus = require('http-status');
const sequenceService = require('../common/sequence.service');
const preventiveMonitoringService = require('../preventive/preventiveMonitoring.service');
const schedulePreventiveService = require('../preventive/schedulePreventive.service');
const preventiveService = require('../preventive/preventive.service');
const { scheduleBasedOnType } = require('../../utils/constant');
const assetMaintenanceService = require('../common/assetMaintenance.service');

const createPreventiveOfModel = async (data) => {
    const preventiveOfModel = await PreventiveOfModelModel.create(data.preventiveOfModel);
    // Thêm lại các Task và TaskItem mới
    if (!data.preventiveOfModelTasks || data.preventiveOfModelTasks.length === 0) {
        throw new ApiError(httpStatus.NOT_FOUND, 'preventiveOfModelTasks not found');
    }
    if (data.preventiveOfModelTasks && data.preventiveOfModelTasks.length > 0) {
        // eslint-disable-next-line no-plusplus
        for (let i = 0; i < data.preventiveOfModelTasks.length; i++) {
            const task = data.preventiveOfModelTasks[i];
            delete task._id; // Xóa _id nếu có
            task.preventiveOfModel = preventiveOfModel._id;
            // eslint-disable-next-line no-await-in-loop
            const newTask = await PreventiveOfModelTaskModel.create(task);
            if (task.taskItems && task.taskItems.length > 0) {
                // eslint-disable-next-line no-plusplus
                for (let j = 0; j < task.taskItems.length; j++) {
                    const item = task.taskItems[j];
                    item.preventiveOfModelTask = newTask._id;
                    item.preventiveOfModel = preventiveOfModel._id;
                    // eslint-disable-next-line no-await-in-loop
                    await PreventiveOfModelTaskItemModel.create(item);
                }
            }
        }
    }
    // Thêm lại SpareParts mới
    if (data.preventiveOfModelSpareParts && data.preventiveOfModelSpareParts.length > 0) {
        // eslint-disable-next-line no-plusplus
        for (let i = 0; i < data.preventiveOfModelSpareParts.length; i++) {
            const part = data.preventiveOfModelSpareParts[i];
            part.preventiveOfModel = preventiveOfModel._id;
            // eslint-disable-next-line no-await-in-loop
            await PreventiveOfModelSparePartModel.create(part);
        }
    }
    if (data.preventiveOfModelConditionBaseds && data.preventiveOfModelConditionBaseds.length > 0) {
        // eslint-disable-next-line no-plusplus
        for (let i = 0; i < data.preventiveOfModelConditionBaseds.length; i++) {
            const part = data.preventiveOfModelConditionBaseds[i];
            part.preventiveOfModel = preventiveOfModel._id;
            // eslint-disable-next-line no-await-in-loop
            await PreventiveOfModelConditionBasedModel.create(part);
        }
    }
    return preventiveOfModel;
};
const queryPreventiveOfModels = async (filter) => {
    const queryPreventiveOfModels = await PreventiveOfModelModel.find(filter)
        .populate({ path: 'assetMaintenanceMonitoringPoint' })
        .sort({ createdAt: -1 });
    return queryPreventiveOfModels;
};
const getPreventiveOfModelTaskByRes = async (data) => {
    const serviceTasks = await PreventiveOfModelTaskModel.find(data);
    return serviceTasks;
};
const getPreventiveOfModelTaskItemByRes = async (data) => {
    const serviceTaskItems = await PreventiveOfModelTaskItemModel.find(data);
    return serviceTaskItems;
};
const getPreventiveOfModelSaprePartByRes = async (data) => {
    const serviceTasks = await PreventiveOfModelSparePartModel.find(data);
    return serviceTasks;
};
const getPreventiveOfModelConditionBasedByRes = async (data) => {
    const serviceTasks = await PreventiveOfModelConditionBasedModel.find(data);
    return serviceTasks;
};
const getPreventiveOfModelById = async (id) => {
    const preventiveOfModel = await PreventiveOfModelModel.findById(id);
    if (!preventiveOfModel) {
        throw new ApiError(httpStatus.NOT_FOUND, 'preventiveOfModel not found');
    }
    return preventiveOfModel;
};
const updatePreventiveOfModelById = async (id, data, user) => {
    const preventiveOfModel = await PreventiveOfModelModel.findById(id);
    if (!preventiveOfModel) {
        throw new ApiError(httpStatus.NOT_FOUND, 'preventiveOfModel not found');
    }
    if (!data.preventiveOfModelTasks || data.preventiveOfModelTasks.length === 0) {
        throw new ApiError(httpStatus.NOT_FOUND, 'preventiveOfModelTasks not found');
    }
    // Cập nhật thông tin chính của Preventive
    Object.assign(preventiveOfModel, data.preventiveOfModel);
    await preventiveOfModel.save();
    // Xóa các dữ liệu liên quan cũ
    const tasks = await PreventiveOfModelTaskModel.find({ preventiveOfModel: id }).select('_id');
    const taskIds = tasks.map((task) => task._id);
    await PreventiveOfModelTaskItemModel.deleteMany({ preventiveOfModelTask: { $in: taskIds } });
    await PreventiveOfModelTaskModel.deleteMany({ preventiveOfModel: id });
    await PreventiveOfModelSparePartModel.deleteMany({ preventiveOfModel: id });
    await PreventiveOfModelConditionBasedModel.deleteMany({ preventiveOfModel: id });
    // Thêm lại các Task và TaskItem mới
    if (data.preventiveOfModelTasks && data.preventiveOfModelTasks.length > 0) {
        // eslint-disable-next-line no-plusplus
        for (let i = 0; i < data.preventiveOfModelTasks.length; i++) {
            const task = data.preventiveOfModelTasks[i];
            delete task._id; // Xóa _id nếu có
            task.preventiveOfModel = preventiveOfModel._id;
            // eslint-disable-next-line no-await-in-loop
            const newTask = await PreventiveOfModelTaskModel.create(task);

            if (task.taskItems && task.taskItems.length > 0) {
                // eslint-disable-next-line no-plusplus
                for (let j = 0; j < task.taskItems.length; j++) {
                    const item = task.taskItems[j];
                    item.preventiveOfModelTask = newTask._id;
                    item.preventiveOfModel = preventiveOfModel._id;
                    // eslint-disable-next-line no-await-in-loop
                    await PreventiveOfModelTaskItemModel.create(item);
                }
            }
        }
    }
    // Thêm lại SpareParts mới
    if (data.preventiveOfModelSpareParts && data.preventiveOfModelSpareParts.length > 0) {
        // eslint-disable-next-line no-plusplus
        for (let i = 0; i < data.preventiveOfModelSpareParts.length; i++) {
            const part = data.preventiveOfModelSpareParts[i];
            part.preventiveOfModel = preventiveOfModel._id;
            // eslint-disable-next-line no-await-in-loop
            await PreventiveOfModelSparePartModel.create(part);
        }
    }
    if (data.preventiveOfModelConditionBaseds && data.preventiveOfModelConditionBaseds.length > 0) {
        // eslint-disable-next-line no-plusplus3
        for (let i = 0; i < data.preventiveOfModelConditionBaseds.length; i++) {
            const part = data.preventiveOfModelConditionBaseds[i];
            part.preventiveOfModel = preventiveOfModel._id;
            // eslint-disable-next-line no-await-in-loop
            await PreventiveOfModelConditionBasedModel.create(part);
        }
    }
    //delete Preventive And SchedulePreventive
    const preventives = await PreventiveModel.find({ preventiveOfModel: preventiveOfModel._id });
    if (preventives && preventives.length > 0) {
        for (const preventive of preventives) {
            await updatePreventiveAndScheduleByPreventiveOfModel(preventiveOfModel._id, preventive.assetMaintenance, user);
        }
    }

    return preventiveOfModel;
};
const deletePreventiveOfModelById = async (id) => {
    const preventiveOfModel = await PreventiveOfModelModel.findById(id);
    if (!preventiveOfModel) {
        throw new ApiError(httpStatus.NOT_FOUND, 'preventiveOfModel not found');
    }
    //delete Preventive And SchedulePreventive
    const preventives = await PreventiveModel.find({ preventiveOfModel: preventiveOfModel._id });
    if (preventives && preventives.length > 0) {
        for (const preventive of preventives) {
            await preventiveService.deletePreventiveById(preventive._id);
        }
    }
    await PreventiveOfModelSparePartModel.deleteMany({ preventiveOfModel: id });
    await PreventiveOfModelConditionBasedModel.deleteMany({ preventiveOfModel: id });
    await PreventiveOfModelTaskModel.deleteMany({ preventiveOfModel: id });
    // Xóa các PreventiveTaskItem liên quan
    const tasks = await PreventiveOfModelTaskModel.find({ preventiveOfModel: id }).select('_id');
    const taskIds = tasks.map((task) => task._id);
    await PreventiveOfModelTaskItemModel.deleteMany({ preventiveOfModelTask: { $in: taskIds } });
    await PreventiveOfModelSparePartModel.deleteMany({ preventive: id });
    await preventiveOfModel.remove();
    return preventiveOfModel;
};
const genPreventiveByPreventiveOfModel = async (
    preventiveOfModel,
    assetMaintenance,
    user,
    actualScheduleDate,
    initialValue
) => {
    const preventiveOfModelTasks = await PreventiveOfModelTaskModel.find({
        preventiveOfModel: preventiveOfModel._id,
    }).lean();
    const taskIds = preventiveOfModelTasks.map((t) => t._id);
    const preventiveOfModelTaskItems = await PreventiveOfModelTaskItemModel.find({
        preventiveOfModelTask: { $in: taskIds },
    }).lean();
    const preventiveOfModelSpareParts = await PreventiveOfModelSparePartModel.find({
        preventiveOfModel: preventiveOfModel._id,
    }).lean();
    const preventiveOfModelConditionBaseds = await PreventiveOfModelConditionBasedModel.find({
        preventiveOfModel: preventiveOfModel._id,
    }).lean();
    //cretae
    const data = preventiveOfModel.toObject();
    const payload = {
        ...data,
        code: await sequenceService.generateSequenceCode('PREVENTIVE'),
        assetMaintenance: assetMaintenance,
        preventiveOfModel: preventiveOfModel._id,
        createdBy: user,
        _id: undefined,
        status: 'started',
        isStart: true,
        actualScheduleDate: actualScheduleDate,
    };
    if (initialValue) {
        payload.initialValue = initialValue;
    }
    const preventive = await PreventiveModel.create(payload);
    const taskIdMap = {};
    // eslint-disable-next-line no-restricted-syntax
    for (const preventiveOfModelTask of preventiveOfModelTasks) {
        // eslint-disable-next-line no-await-in-loop
        const newTask = await PreventiveTaskModel.create({
            ...preventiveOfModelTask,
            _id: undefined,
            preventive: preventive._id,
            preventiveOfModel: preventiveOfModel._id,
        });
        taskIdMap[preventiveOfModelTask._id] = newTask._id;
    }
    // eslint-disable-next-line no-restricted-syntax
    for (const preventiveOfModelTaskItem of preventiveOfModelTaskItems) {
        // eslint-disable-next-line no-await-in-loop
        await PreventiveTaskItemModel.create({
            ...preventiveOfModelTaskItem,
            preventiveTask: taskIdMap[preventiveOfModelTaskItem.preventiveOfModelTask],
            _id: undefined,
            preventiveOfModel: preventiveOfModel._id,
        });
    }
    // eslint-disable-next-line no-restricted-syntax
    for (const preventiveOfModelSparePart of preventiveOfModelSpareParts) {
        // eslint-disable-next-line no-await-in-loop
        await PreventiveSparePartModel.create({
            ...preventiveOfModelSparePart,
            _id: undefined,
            preventive: preventive._id,
            preventiveOfModel: preventiveOfModel._id,
        });
    }
    for (const preventiveOfModelConditionBased of preventiveOfModelConditionBaseds) {
        // eslint-disable-next-line no-await-in-loop
        await PreventiveConditionBasedModel.create({
            ...preventiveOfModelConditionBased,
            _id: undefined,
            preventive: preventive._id,
            preventiveOfModel: preventiveOfModel._id,
        });
    }
    if (preventive.scheduleType === scheduleBasedOnType.monitoring) {
        const data = {
            preventive: preventive._id,
            startDate: new Date(), // trả về kiểu Date thay vì timestamp
            createdBy: user._id ?? user,
        };
        await preventiveMonitoringService.createPreventiveMonitoring(data, initialValue);
    } else if (preventive.scheduleType === scheduleBasedOnType.adhoc) {
        await preventiveService.copyDataSchedulePreventiveByPreventive(preventive, user._id ?? user, Date.now());
    } else if (preventive.scheduleType === scheduleBasedOnType.conditionBasedSchedule) {
        return;
    } else {
        await preventiveService.generateSchedulePrenventive(preventive._id, user._id ?? user);
    }
};
const updatePreventiveAndScheduleByPreventiveOfModel = async (_preventiveOfModel, assetMaintenance, user) => {
    const preventiveOfModel = await PreventiveOfModelModel.findById(_preventiveOfModel).lean();
    if (!preventiveOfModel) return;

    const [modelTasks, modelTaskItems, modelSpareParts] = await Promise.all([
        PreventiveOfModelTaskModel.find({ preventiveOfModel: _preventiveOfModel }).lean(),
        PreventiveOfModelTaskItemModel.find({}).lean(),
        PreventiveOfModelSparePartModel.find({ preventiveOfModel: _preventiveOfModel }).lean(),
    ]);
    delete preventiveOfModel._id;
    const preventive = await PreventiveModel.findOneAndUpdate(
        { preventiveOfModel: _preventiveOfModel, assetMaintenance },
        preventiveOfModel,
        { new: true }
    );

    if (!preventive) return;

    // Xóa dữ liệu cũ
    const oldTasks = await PreventiveTaskModel.find({ preventive: preventive._id }).select('_id');
    const oldTaskIds = oldTasks.map((t) => t._id);
    await Promise.all([
        PreventiveTaskItemModel.deleteMany({ preventiveTask: { $in: oldTaskIds } }),
        PreventiveTaskModel.deleteMany({ preventive: preventive._id }),
        PreventiveSparePartModel.deleteMany({ preventive: preventive._id }),
        schedulePreventiveService.deleteManySchedulePreventive({
            preventive: preventive._id,
            startDate: { $gte: new Date() },
        }),
    ]);

    // Map taskId cũ ↔ mới
    const taskIdMap = {};
    for (const modelTask of modelTasks) {
        const newTask = await PreventiveTaskModel.create({
            ...modelTask,
            _id: undefined,
            preventive: preventive._id,
            preventiveOfModel: _preventiveOfModel,
        });
        taskIdMap[modelTask._id] = newTask._id;
    }

    // Tạo lại taskItem
    const relatedTaskItems = modelTaskItems.filter((item) => taskIdMap[item.preventiveOfModelTask]);
    for (const modelTaskItem of relatedTaskItems) {
        await PreventiveTaskItemModel.create({
            ...modelTaskItem,
            _id: undefined,
            preventiveTask: taskIdMap[modelTaskItem.preventiveOfModelTask],
            preventiveOfModel: _preventiveOfModel,
        });
    }

    // Tạo lại spare part
    for (const modelSparePart of modelSpareParts) {
        await PreventiveSparePartModel.create({
            ...modelSparePart,
            _id: undefined,
            preventive: preventive._id,
            preventiveOfModel: _preventiveOfModel,
        });
    }

    // Sinh lại schedule
    await preventiveService.generateSchedulePrenventive(preventive._id, user);
};

const startPreventiveByPreventiveOfModel = async (id, assetMaintenance, user, actualScheduleDate, initialValue) => {
    const preventiveOfModel = await PreventiveOfModelModel.findById(id);
    if (!preventiveOfModel) {
        throw new ApiError(httpStatus.NOT_FOUND, 'preventiveOfModel not found');
    }
    // const preventive = await PreventiveModel.countDocuments({ preventiveOfModel: preventiveOfModel._id, activity: true });
    // if (preventive && preventive > 0) {
    //     throw new ApiError(httpStatus.NOT_FOUND, 'Đã có lịch bảo trì.');
    // }
    await assetMaintenanceService.checkAssetMaintenanceNotWithAssetStatus(assetMaintenance);
    await genPreventiveByPreventiveOfModel(preventiveOfModel, assetMaintenance, user, actualScheduleDate, initialValue);
    return preventiveOfModel;
};
const stopPreventiveByPreventiveOfModel = async (id, assetMaintenance, user) => {
    const preventiveOfModel = await PreventiveOfModelModel.findById(id);
    if (!preventiveOfModel) {
        throw new ApiError(httpStatus.NOT_FOUND, 'preventiveOfModel not found');
    }
    const preventive = await PreventiveModel.findOne({
        preventiveOfModel: preventiveOfModel._id,
        assetMaintenance: assetMaintenance,
        activity: true,
    });
    // update về false
    preventive.activity = false;
    preventive.save();
    // ẩn luôn các PreventiveMonitoring liên quan
    await PreventiveMonitoringModel.updateMany({ preventive: preventive?._id, activity: true }, { activity: false });
    // Lấy các SchedulePreventive liên quan
    await schedulePreventiveService.deleteManySchedulePreventive({
        preventive: preventive?._id,
        startDate: { $gte: new Date() },
    });
    return preventiveOfModel;
};
const getTotalPreventiveByPreventiveOfModel = async (preventiveOfModel, assetMaintenance) => {
    const countPrevetive = await PreventiveModel.countDocuments({
        preventiveOfModel: preventiveOfModel,
        assetMaintenance: assetMaintenance,
        activity: true,
        isStart: true,
    });
    return countPrevetive;
};
module.exports = {
    createPreventiveOfModel,
    queryPreventiveOfModels,
    getPreventiveOfModelTaskByRes,
    getPreventiveOfModelTaskItemByRes,
    getPreventiveOfModelSaprePartByRes,
    getPreventiveOfModelById,
    updatePreventiveOfModelById,
    deletePreventiveOfModelById,
    startPreventiveByPreventiveOfModel,
    stopPreventiveByPreventiveOfModel,
    getTotalPreventiveByPreventiveOfModel,
    getPreventiveOfModelConditionBasedByRes,
};
