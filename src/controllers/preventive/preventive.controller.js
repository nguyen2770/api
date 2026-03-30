const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const catchAsync = require('../../utils/catchAsync');
const { preventiveService, sequenceService, schedulePreventiveService } = require('../../services');
const ApiError = require('../../utils/ApiError');
const { preventiveStatus } = require('../../utils/constant');

/**
 * Create a user
 * @type {(function(*, *, *): void)|*}
 */
const createPreventive = catchAsync(async (req, res) => {
    const payload = {
        preventive: {
            ...req.body.preventive,
            createdBy: req.user.id,
            code: await sequenceService.generateSequenceCode('PREVENTIVE'),
        },
        preventiveSpareParts: req.body.preventiveSpareParts,
        preventiveTasks: req.body.preventiveTasks,
        preventiveConditionBaseds: req.body.preventiveConditionBaseds,
    };

    const preventive = await preventiveService.createPreventive(payload);
    res.status(httpStatus.CREATED).send({ code: 1, preventive });
});

const getPreventives = catchAsync(async (req, res) => {
    const options = pick(req.body, ['sortBy', 'sortOrder', 'limit', 'page']);
    const filter = pick(req.body, [
        'branchs',
        'serial',
        'status',
        'code',
        'ticketStatus',
        'preventiveStatus',
        'importance',
        'preventiveName',
        'assetStyle',
        'assetModelName',
        'assetName',
        'searchText',
        'preventiveOfModel',
        'assetModel',
        'isOtherPreventiveOfModel',
    ]);
    const { preventives, totalResults } = await preventiveService.queryPreventives(filter, options, req);
    const preventiveWithTasks = await Promise.all(
        preventives.map(async (preventive) => {
            const serviceObj = preventive;
            // Lấy danh sách công việc
            const serviceTasks = await preventiveService.getPreventiveTaskByPreventiveId(serviceObj._id);
            if (serviceTasks.length > 0) {
                const serviceTaskObjs = [];
                for (let index = 0; index < serviceTasks.length; index++) {
                    const element = serviceTasks[index].toObject();
                    element.taskItems = await preventiveService.getPreventiveTaskItemByTaskId(element._id);
                    element.preventiveTaskAssignUsers = await preventiveService.getPreventiveTaskAssignUserByTaskId(
                        element._id
                    );
                    serviceTaskObjs.push(element);
                }
                serviceObj.preventiveTasks = serviceTaskObjs;
            } else {
                serviceObj.preventiveTasks = [];
            }
            // Lấy spare parts
            const preventiveSpareParts = await preventiveService.getPreventiveSaprePartByPreventiveId(serviceObj._id);
            serviceObj.preventiveSparePart = preventiveSpareParts;
            return serviceObj;
        })
    );

    res.send({ results: { ...totalResults, results: preventiveWithTasks }, code: 1 });
});

const getPreventiveById = catchAsync(async (req, res) => {
    const preventive = await preventiveService.getPreventiveById(req.query.id);
    if (!preventive) {
        throw new ApiError(httpStatus.NOT_FOUND, 'preventive not found');
    }
    const serviceObj = preventive.toObject();
    if (!serviceObj) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Service not found');
    }
    const serviceTasks = await preventiveService.getPreventiveTaskByPreventiveId(serviceObj._id);
    if (serviceTasks.length > 0) {
        const serviceTaskObjs = [];
        // eslint-disable-next-line no-plusplus
        for (let index = 0; index < serviceTasks.length; index++) {
            const element = serviceTasks[index].toObject();
            // eslint-disable-next-line no-await-in-loop
            element.taskItems = await preventiveService.getPreventiveTaskItemByTaskId(element._id);
            serviceTaskObjs.push(element);
        }
        serviceObj.preventiveTask = serviceTaskObjs;
    } else {
        serviceObj.preventiveTask = [];
    }
    const preventiveSpareParts = await preventiveService.getPreventiveSaprePartByPreventiveId(serviceObj._id);
    serviceObj.preventiveSparePart = preventiveSpareParts; // Thêm dòng này
    const preventiveConditionBaseds = await preventiveService.getpreventiveConditionBasedsByPreventive(serviceObj._id);
    serviceObj.preventiveConditionBaseds = preventiveConditionBaseds;
    res.send({ code: 1, data: serviceObj });
});

/**
 * Update user by id.
 * @type {(function(*, *, *): void)|*}
 */
const updatePreventive = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body.data;
    const updated = await preventiveService.updatePreventiveById(id, updateData);
    res.send({ code: 1, data: updated });
});

/**
 * Delete user by id.
 * @type {(function(*, *, *): void)|*}
 */
const deletePreventive = catchAsync(async (req, res) => {
    await preventiveService.deletePreventiveById(req.query.id);
    res.status(httpStatus.OK).send({ code: 1 });
});

const updateStatus = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body.data;
    const updated = await preventiveService.updateStatus(id, updateData);
    res.send({ code: 1, data: updated });
});

const getAllPreventive = catchAsync(async (req, res) => {
    const preventives = await preventiveService.getAllPreventive();
    res.send({ code: 1, data: preventives });
});

const stopPreventive = catchAsync(async (req, res) => {
    const { preventive, ...updateData } = req.body.data;
    const data = {
        ...updateData,
        status: preventiveStatus.stoped,
        isStart: false,
    };
    const updated = await preventiveService.updateStatus(preventive, data);
    await schedulePreventiveService.deleteManySchedulePreventive({ preventive, startDate: { $gte: new Date() } });
    res.send({ code: 1, data: updated });
});

const getResAssignUserByPreventive = catchAsync(async (req, res) => {
    const { preventive } = req.query; // hoặc req.body nếu bạn gửi từ body
    if (!preventive) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'preventive is required');
    }
    const users = await preventiveService.getResAssignUserByPreventive(preventive);
    res.send({ code: 1, data: users });
});
// chưa  được sử dụng ở đâu
const comfirmReAssignUser = catchAsync(async (req, res) => {
    const { preventive, dataUpdate } = req.body;
    if (!preventive || !dataUpdate) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'preventive and dataUpdate are required');
    }
    await preventiveService.comfirmReAssignUser(preventive, dataUpdate);
    res.send({ code: 1, message: 'Re-assign user charge successful' });
});
const startPreventive = catchAsync(async (req, res) => {
    const { preventive, actualScheduleDate, initialValue, supervisor, frequency, cycle } = req.body;
    const updated = await preventiveService.startPreventive(
        preventive,
        actualScheduleDate,
        initialValue,
        supervisor,
        frequency,
        cycle
    );
    await preventiveService.generateSchedulePrenventive(updated._id, req.user.id);
    res.send({ code: 1, data: updated });
});
const createPreventiveComment = catchAsync(async (req, res) => {
    req.body = {
        ...req.body,
        createdBy: req.user.id,
    };
    const preventive = await preventiveService.createPreventiveComment(req.body);
    res.status(httpStatus.CREATED).send({ code: 1, preventive });
});
const getPreventiveComments = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['comments', 'preventive']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await preventiveService.getPreventiveComments(filter, options);
    res.send({ code: 1, result });
});
const getPreventiveByConditionBasedSchedule = catchAsync(async (req, res) => {
    const options = pick(req.body, ['sortBy', 'sortOrder', 'limit', 'page']);
    const filter = pick(req.body, [
        'searchText',
        'code',
        'assetName',
        'assetModelName',
        'serial',
        'assetNumber',
        'supervisorName',
        'supervisor',
        'customerName',
        'customer',
    ]);
    const results = await preventiveService.getPreventiveByConditionBasedSchedule(
        filter,
        options,
        req.user.id
    );
    const preventiveWithConditionBaseSchedules = await Promise.all(
        results?.preventives?.map(async (preventive) => {
            const preventiveConditionBaseds = await preventiveService.getAllPreventiveConditionBasedSchedule(preventive._id);
            return {
                ...preventive,
                preventiveConditionBaseds,
            };
        })
    );
    res.send({
        code: 1,
        totalResults: results.totalResults || 0,
        results: preventiveWithConditionBaseSchedules
    });
});
const generateSchedulePrenventiveByPreventiveConditionBasedSchedule = catchAsync(async (req, res) => {
    const { measurements, note, preventive } = req.body;
    const schedulePreventives = await preventiveService.generateSchedulePrenventiveByPreventiveConditionBasedSchedule(
        measurements,
        note,
        preventive,
        req.user.id
    );
    res.send({ code: 1, data: schedulePreventives });
});
const getAllPreventiveConditionBasedScheduleHistoryByPreventive = catchAsync(async (req, res) => {
    const { preventive } = req.body;
    if (!preventive) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'preventive is required');
    }
    const preventiveConditionBasedHistorys =
        await preventiveService.getAllPreventiveConditionBasedScheduleHistoryByPreventive(preventive);
    const preventiveConditionBasedHistorysWithDetails = await Promise.all(
        preventiveConditionBasedHistorys.map(async (history) => {
            const historyObj = history.toObject();
            const details = await preventiveService.getPreventiveConditionBasedHistoryDetailsByHistoryId(historyObj._id);
            return {
                ...historyObj,
                details,
            };
        })
    );
    res.send({ code: 1, data: preventiveConditionBasedHistorysWithDetails });
});
const changeOfContractPreventive = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body;
    const change = await preventiveService.changeOfContractPreventive(id, updateData);
    // // xóa đi các schedule lớn hơn ngày hiện tại
    // await schedulePreventiveService.deleteManySchedulePreventive({
    //     preventive: change._id,
    //     startDate: { $gte: new Date() },
    // });
    // update lại các công việc schedulepreventive
    await schedulePreventiveService.updateSchedulePreventiveTaskAndAssignUserAboutIsCancel(change._id);
    // genra tiếp các bản ghi - chỗ này nếu dùng làm này sẽ gen trùng bản ghi hiện tại. Không bảo qua các công việc đã làm việc
    // await preventiveService.generateSchedulePrenventive(change._id, req.user.id);
    res.send({ code: 1, data: change });
});
module.exports = {
    createPreventive,
    getPreventives,
    getPreventiveById,
    updatePreventive,
    deletePreventive,
    updateStatus,
    getAllPreventive,
    stopPreventive,
    getResAssignUserByPreventive,
    comfirmReAssignUser,
    startPreventive,
    createPreventiveComment,
    getPreventiveComments,
    getPreventiveByConditionBasedSchedule,
    generateSchedulePrenventiveByPreventiveConditionBasedSchedule,
    getAllPreventiveConditionBasedScheduleHistoryByPreventive,
    changeOfContractPreventive,
};
