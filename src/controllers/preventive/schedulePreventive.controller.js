const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const catchAsync = require('../../utils/catchAsync');
const {
    schedulePreventiveService,
    preventiveService,
    sequenceService,
    schedulePrevetiveTaskSparePartRequestService,
    userService,
    approvalTaskService,
    assetMaintenanceService,
} = require('../../services');
const ApiError = require('../../utils/ApiError');
const {
    schedulePreventiveTaskAssignUserStatus,
    ticketSchedulePreventiveStatus,
    schedulePreventiveStatus,
    schedulePreventiveTaskRequestSparePartStatus,
    notificationTypeCode,
    workAsset,
} = require('../../utils/constant');
const notificationService = require('../../services/notification/notification.service');
/**
 * Create a user
 * @type {(function(*, *, *): void)|*}
 */

const createSchedulePreventive = catchAsync(async (req, res) => {
    const data = { ...req.body, code: await sequenceService.generateSequenceCode('SCHEDULE_PREVENTIVE') };
    const schedulePreventive = await schedulePreventiveService.createSchedulePreventive(data);
    if (data.preventive) {
        const dataRes = {
            isStart: true,
        };
        await preventiveService.updateStatus(data.preventive, dataRes);
    }
    res.status(httpStatus.CREATED).send({ code: 1, schedulePreventive });
});

const getSchedulePreventivees = catchAsync(async (req, res) => {
    const filter = pick(req.body, [
        'schedulePreventiveStatus',
        'branchs',
        'code',
        'status',
        'importance',
        'preventive',
        'serial',
        'ticketStatus',
        'startDate',
        'endDate',
        'preventiveName',
        'assetStyle',
        'assetModelName',
        'assetName',
        'searchText',
    ]);
    const options = pick(req.body, ['sortBy', 'limit', 'page', 'sortOrder']);
    const { _schedulePreventives, totalResults } = await schedulePreventiveService.querySchedulePreventives(filter, options, req);
    const schedulePreventives = await Promise.all(
        _schedulePreventives.map(async (item) => {
            const schedulePreventive = item;
            // Lấy danh sách công việc
            const serviceTasks = await schedulePreventiveService.getSchedulePreventiveTaskByRes({
                schedulePreventive: schedulePreventive._id,
            });
            if (serviceTasks.length > 0) {
                const serviceTaskObjs = [];
                for (let index = 0; index < serviceTasks.length; index++) {
                    const element = serviceTasks[index].toObject();
                    element.taskItems = await schedulePreventiveService.getSchedulePreventiveTaskItemByRes({
                        schedulePreventiveTask: element._id,
                    });
                    element.schedulePreventiveTaskAssignUserIsActive =
                        await schedulePreventiveService.getSchedulePreventiveTaskAssignUserByStatus({
                            schedulePreventiveTask: element._id,
                            status: { $ne: schedulePreventiveTaskAssignUserStatus.replacement },
                        });
                    element.schedulePreventiveTaskAssignUserReplacements =
                        await schedulePreventiveService.getSchedulePreventiveTaskAssignUserByRes({
                            schedulePreventiveTask: element._id,
                            status: schedulePreventiveTaskAssignUserStatus.replacement,
                        });
                    serviceTaskObjs.push(element);
                }
                schedulePreventive.schedulePreventiveTasks = serviceTaskObjs;
            } else {
                schedulePreventive.schedulePreventiveTasks = [];
            }
            // Lấy spare parts
            const schedulePreventiveSpareParts = await schedulePreventiveService.getSchedulePreventiveSparePartByRes({
                schedulePreventive: schedulePreventive._id,
            });
            schedulePreventive.schedulePreventiveSparePart = schedulePreventiveSpareParts;
            schedulePreventive.totalDownTimeSchedulePreventive =
                await schedulePreventiveService.totalDownTimeSchedulePreventive(schedulePreventive._id);
            return schedulePreventive;
        })
    );
    res.send({ code: 1, ...totalResults, schedulePreventives });
});
const confirmSchedulePreventiveUser = catchAsync(async (req, res) => {
    const { schedulePreventiveTask } = req.body;
    const schedulePreventiveServiceConfirm = await schedulePreventiveService.confirmSchedulePreventiveUser(
        schedulePreventiveTask,
        req.user.id
    );
    if (!schedulePreventiveServiceConfirm) {
        throw new ApiError(httpStatus.NOT_FOUND, 'schedulePreventiveServiceConfirm not found');
    }
    // check xem đã xác nhận công việc hết hay chưa


    // chuyển assetMaintenance về trạng thái về tạm dừng
    // const schedulePreventive = await schedulePreventiveService.getByTask(schedulePreventiveTask)
    // if (schedulePreventive) {
    //     await assetMaintenanceService.updatePauseAsset(schedulePreventive.assetMaintenance, req.user.id, schedulePreventive._id);
    // }

    res.send({ code: 1, data: schedulePreventiveServiceConfirm });
});
const cancelConfirmSchedulePreventiveUser = catchAsync(async (req, res) => {
    const { schedulePreventiveTask, reasonCancelConfirm } = req.body;
    const asset = await schedulePreventiveService.cancelConfirmSchedulePreventiveUser(
        schedulePreventiveTask,
        req.user.id,
        reasonCancelConfirm
    );
    if (!asset) {
        throw new ApiError(httpStatus.NOT_FOUND, 'category not found');
    }
    res.send({ code: 1, data: asset });
});
const getSchedulePreventiveById = catchAsync(async (req, res) => {
    const schedulePreventive = await schedulePreventiveService.getSchedulePreventiveById(req.query.id, req.user.id);
    if (!schedulePreventive) {
        throw new ApiError(httpStatus.NOT_FOUND, 'category not found');
    }
    if (schedulePreventive.tasks.length > 0) {
        for (let index = 0; index < schedulePreventive.tasks.length; index++) {
            const element = schedulePreventive.tasks[index];
            // element.taskItems = await schedulePreventiveService.getSchedulePreventiveTaskItemByRes({ schedulePreventiveTask: element._id });
            element.schedulePreventiveTaskAssignUserIsActive =
                await schedulePreventiveService.getSchedulePreventiveTaskAssignUserByStatus({
                    schedulePreventiveTask: element._id,
                    status: { $ne: schedulePreventiveTaskAssignUserStatus.replacement },
                });
            element.schedulePreventiveTaskAssignUserReplacements =
                await schedulePreventiveService.getSchedulePreventiveTaskAssignUserByRes({
                    schedulePreventiveTask: element._id,
                    status: schedulePreventiveTaskAssignUserStatus.replacement,
                });
        }
    }
    const schedulePreventiveSpareParts = await schedulePreventiveService.getSchedulePreventiveSparePartByRes({
        schedulePreventive: schedulePreventive._id,
    });
    const schedulePreventiveRequestSpareParts =
        await schedulePrevetiveTaskSparePartRequestService.getScheduleePreventiveRequestSparePartByRes({
            schedulePreventive: schedulePreventive._id,
        });
    const schedulePreventiveHistorys = await schedulePreventiveService.getSchedulePreventiveHistorys(schedulePreventive._id);
    res.send({
        code: 1,
        data: schedulePreventive,
        schedulePreventiveHistorys,
        schedulePreventiveSpareParts,
        schedulePreventiveRequestSpareParts,
    });
});

/**
 * Update user by id.
 * @type {(function(*, *, *): void)|*}
 */
const updateSchedulePreventive = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body.data;
    // updateData.updatedBy = req.user.id; // Nếu cần
    const updated = await schedulePreventiveService.updateSchedulePreventiveById(id, updateData);
    res.send({ code: 1, data: updated });
});

/**
 * Delete user by id.
 * @type {(function(*, *, *): void)|*}
 */
const deleteSchedulePreventive = catchAsync(async (req, res) => {
    await schedulePreventiveService.deleteSchedulePreventiveById(req.query.id);
    res.status(httpStatus.OK).send({ code: 1 });
});
const schedulePreventiveCheckInOut = catchAsync(async (req, res) => {
    const { checkInOutList, taskItems, schedulePreventiveTask, user } = req.body;
    const { hasProblem } = await schedulePreventiveService.checkInOutListAndTasks(
        checkInOutList,
        taskItems,
        schedulePreventiveTask,
        user
    );
    if (schedulePreventiveTask && schedulePreventiveTask?.id) {
        const schedulePreventiveTaskById = await schedulePreventiveService.schedulePreventiveTaskById(
            schedulePreventiveTask?.id
        );
        if (schedulePreventiveTaskById) {
            const schedulePreventive = await schedulePreventiveService.getSchedulePreventiveByIdNotPopulate(
                schedulePreventiveTaskById.schedulePreventive
            );
            const user = await userService.getUserById(req.user.id);
            const isPartial = hasProblem === true;
            await notificationService.pushNotification({
                notificationTypeCode: notificationTypeCode.maintenance_work_completed,
                isNotifyTheManager: true,
                text: `Kỹ sư ${user?.fullName} đã hoàn thành${isPartial ? ' một phần' : ''} công việc bảo trì : ${schedulePreventive.code
                    }`,
                subUrl: `bao-tri/chi-tiet/${schedulePreventive._id}`,
                webSubUrl: `maintenance/work-order-schedule-preventive/view/${schedulePreventive._id}`,
                notificationName: 'Hoàn thành công việc bảo trì',
            });
        }
    }

    res.send({ code: 1, message: 'Updated successfully' });
});
const schedulePreventiveTaskAssignUser = catchAsync(async (req, res) => {
    const { schedulePreventive, schedulePreventiveTask, user, reassignUser, comment } = req.body;
    await schedulePreventiveService.schedulePreventiveTaskAssignUser(
        schedulePreventive,
        schedulePreventiveTask,
        user,
        reassignUser,
        req.user.id
    );
    if (schedulePreventive) {
        await schedulePreventiveService.createSchedulePreventiveComment({
            schedulePreventive,
            comments: comment,
            createdBy: req.user.id,
        });
    }
    res.send({ code: 1, message: 'Assign User completed' });
});
const getMySchedulePreventivees = catchAsync(async (req, res) => {
    const filter = pick(req.body, [
        'schedulePreventiveTaskAssignUserStatuses',
        'ticketSchedulePreventiveTaskAssignUserStatus',
        'code',
        'serial',
        'branchs',
        'schedulePreventiveTaskAssignUserStatus',
        'startDate',
        'endDate',
        'taskName',
        'assetName',
        'importance',
        'assetModelName',
        'searchText',
    ]);
    const options = pick(req.body, ['sortBy', 'sortOrder', 'limit', 'page']);
    const user = req.user.id;
    const { mySchedulePreventives, totalResults } = await schedulePreventiveService.queryMySchedulePreventives(
        filter,
        options,
        user
    );
    const schedulePreventiveTaskAssignUser = await Promise.all(
        mySchedulePreventives.map(async (item) => {
            // const resultObj = item.toObject(); // đổi tên
            const resultObj = item; // đổi tên
            const serviceTasks = await schedulePreventiveService.getSchedulePreventiveTaskByRes({
                _id: resultObj.schedulePreventiveTask,
            });
            if (serviceTasks.length > 0) {
                const serviceTaskObjs = [];
                for (let index = 0; index < serviceTasks.length; index++) {
                    const element = serviceTasks[index].toObject();
                    element.taskItems = await schedulePreventiveService.getSchedulePreventiveTaskItemByRes({
                        schedulePreventiveTask: element._id,
                    });
                    element.schedulePreventiveTaskAssignUserIsActive =
                        await schedulePreventiveService.getSchedulePreventiveTaskAssignUserByStatus({
                            schedulePreventiveTask: element._id,
                            status: { $ne: schedulePreventiveTaskAssignUserStatus.replacement },
                        });
                    element.schedulePreventiveTaskAssignUserReplacements =
                        await schedulePreventiveService.getSchedulePreventiveTaskAssignUserByRes({
                            schedulePreventiveTask: element._id,
                            status: schedulePreventiveTaskAssignUserStatus.replacement,
                        });
                    serviceTaskObjs.push(element);
                }
                resultObj.schedulePreventiveTasks = serviceTaskObjs;
            } else {
                resultObj.schedulePreventiveTasks = [];
            }
            const schedulePreventiveSpareParts = await schedulePreventiveService.getSchedulePreventiveSparePartByRes({
                schedulePreventive: resultObj.schedulePreventiveTask,
            });
            resultObj.schedulePreventiveSparePart = schedulePreventiveSpareParts;
            return resultObj;
        })
    );
    res.send({ code: 1, schedulePreventiveTaskAssignUser, ...totalResults });
});

const getSchedulePreventiveTaskAssignUserById = catchAsync(async (req, res) => {
    const item = await schedulePreventiveService.getSchedulePreventiveTaskAssignUserById(req.query.id);
    if (!item) {
        throw new ApiError(httpStatus.NOT_FOUND, 'category not found');
    }
    const _taskItems = await schedulePreventiveService.getSchedulePreventiveTaskItemByResAndPopulate({
        schedulePreventiveTask: item.schedulePreventiveTask,
    });
    const lastCheckInCheckOut = await schedulePreventiveService.getLastShedulePreventCheckInCheckOutByTaskId(
        item.schedulePreventiveTask
    );
    res.send({ code: 1, data: item, taskItems: _taskItems, lastCheckInCheckOut });
});
const comfirmCancelSchedulePreventive = catchAsync(async (req, res) => {
    const { id, comment } = req.body;
    const payload = {
        comment,
        updatedBy: req.user.id,
        cancelBy: req.user.id,
        cancelDate: Date.now(),
        ticketStatus: ticketSchedulePreventiveStatus.history,
        status: schedulePreventiveStatus.cancelled,
    };
    const updated = await schedulePreventiveService.comfirmCancelSchedulePreventive(id, payload, req.user.id);
    res.send({ code: 1, data: updated });
});

const comfirmCloseSchedulePreventive = catchAsync(async (req, res) => {
    const { schedulePreventive, comment, closeSignature, listResource } = req.body;
    const updated = await schedulePreventiveService.comfirmCloseSchedulePreventive(
        schedulePreventive,
        req.user.id,
        comment,
        closeSignature,
        listResource
    );
    const payload = {
        processedAt: new Date(),
        processedBy: req.user.id,
        status: 'PROCESSED',
    };
    await approvalTaskService.updateApprovalTaskBySourceId(schedulePreventive, payload);

    // update trạng thái assetMaintenance về active
    if (updated) {
        await assetMaintenanceService.updateActiveAsset(updated.assetMaintenance, req.user.id, schedulePreventive, workAsset.schedulePreventive);
    }

    res.send({ code: 1, data: updated });
});

const comfirmReOpenSchedulePreventive = catchAsync(async (req, res) => {
    const { schedulePreventive, comment, schedulePreventiveTask } = req.body;
    const updated = await schedulePreventiveService.comfirmReOpenSchedulePreventive(
        schedulePreventive,
        schedulePreventiveTask,
        req.user.id
    );
    const payload = {
        processedAt: new Date(),
        processedBy: req.user.id,
        status: 'PROCESSED',
    };
    await approvalTaskService.updateApprovalTaskBySourceId(schedulePreventive, payload);
    res.send({ code: 1, data: updated });
});

const getCurrentCheckinCheckout = catchAsync(async (req, res) => {
    const currentCheckinCheckout = await schedulePreventiveService.getCurrentCheckinCheckout(req.user.id);
    const schedulePreventiveTaskAssignUser = await schedulePreventiveService.getSchedulePreventiveTaskAssignUserByStatus({
        user: req.user.id,
        schedulePreventiveTask: currentCheckinCheckout ? currentCheckinCheckout?.schedulePreventiveTask?._id : null,
        status: { $ne: schedulePreventiveTaskAssignUserStatus.replacement },
    });
    res.send({ code: 1, data: currentCheckinCheckout, schedulePreventiveTaskAssignUser });
});
const checkinSchedulePreventiveTask = catchAsync(async (req, res) => {
    const { schedulePreventiveTaskId } = req.body;
    const currentCheckinCheckout = await schedulePreventiveService.getCurrentCheckinCheckout(req.user.id);
    if (currentCheckinCheckout)
        throw new ApiError(httpStatus.EXPECTATION_FAILED, 'Kỹ thuật viên đang thực hiện công việc khác!');
    const schedulePreventiveCheckinCheckOut = await schedulePreventiveService.checkinSchedulePreventiveTask(
        schedulePreventiveTaskId,
        req.user.id
    );

    const schedulePreventive = await schedulePreventiveService.getByTask(schedulePreventiveTaskId)
    if (schedulePreventive) {
        await assetMaintenanceService.updatePauseAsset(schedulePreventive.assetMaintenance, req.user.id, schedulePreventive._id);
    }

    res.send({ code: 1, data: schedulePreventiveCheckinCheckOut, message: 'Check-in thành công' });
});
const checkOutSchedulePreventiveTask = catchAsync(async (req, res) => {
    const { schedulePreventiveCheckinCheckOutId, comment } = req.body;
    const currentCheckinCheckout = await schedulePreventiveService.getCurrentCheckinCheckout(req.user.id);
    if (!currentCheckinCheckout)
        throw new ApiError(httpStatus.EXPECTATION_FAILED, 'Kỹ thuật viên chưa thực hiện công việc!');
    if (currentCheckinCheckout.id !== schedulePreventiveCheckinCheckOutId)
        throw new ApiError(httpStatus.EXPECTATION_FAILED, 'Kỹ thuật viên chưa thực hiện công việc!');
    const schedulePreventiveCheckinCheckOut = schedulePreventiveService.checkOutSchedulePreventiveTask(
        schedulePreventiveCheckinCheckOutId,
        comment,
        req.user.id
    );
    res.send({ code: 1, data: schedulePreventiveCheckinCheckOut });
});
const startWorkschedulePreventiveTask = catchAsync(async (req, res) => {
    const { signature, taskItems, schedulePreventiveTask } = req.body;
    const { _schedulePreventiveTaskUpdate, hasProblem, _schedulePreventiveTask } =
        await schedulePreventiveService.startWorkschedulePreventiveTask(
            taskItems,
            schedulePreventiveTask,
            req.user.id,
            signature
        );
    // tạo thông báo cho
    if (_schedulePreventiveTask?.schedulePreventive) {
        const schedulePreventive = await schedulePreventiveService.getSchedulePreventiveByIdNotPopulate(
            _schedulePreventiveTask.schedulePreventive
        );
        const user = await userService.getUserById(req.user.id);
        const isPartial = hasProblem === true;
        await notificationService.pushNotification({
            notificationTypeCode: notificationTypeCode.maintenance_work_completed,
            isNotifyTheManager: true,
            text: `Kỹ sư ${user?.fullName} đã hoàn thành${isPartial ? ' một phần' : ''} công việc bảo trì : ${schedulePreventive.code
                }`,
            subUrl: `bao-tri/chi-tiet/${schedulePreventive._id}`,
            webSubUrl: `maintenance/work-order-schedule-preventive/view/${schedulePreventive._id}`,
            notificationName: 'Hoàn thành công việc bảo trì',
        });
    }
    res.send({ code: 1, message: 'Updated successfully', data: _schedulePreventiveTaskUpdate });
});
const getTotalSchedulePreventiveStatus = catchAsync(async (req, res) => {
    const filter = pick(req.body, ['branchs']);
    const totalSchedulePreventiveStatuses = await schedulePreventiveService.getTotalSchedulePreventiveStatus(filter, req);
    res.send({ code: 1, data: totalSchedulePreventiveStatuses });
});
const getTotalMySchedulePreventiveStatus = catchAsync(async (req, res) => {
    const totalMySchedulePreventiveStatuses = await schedulePreventiveService.getTotalMySchedulePreventiveStatus(
        req.user.id
    );
    res.send({ code: 1, data: totalMySchedulePreventiveStatuses });
});
const createSchedulePreventiveComment = catchAsync(async (req, res) => {
    req.body = {
        ...req.body,
        createdBy: req.user.id || req.user._id,
    };
    const preventive = await schedulePreventiveService.createSchedulePreventiveComment(req.body);
    res.status(httpStatus.CREATED).send({ code: 1, preventive });
});
const getSchedulePreventiveComments = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['comments', 'schedulePreventive']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await schedulePreventiveService.getSchedulePreventiveComments(filter, options);
    res.send({ code: 1, result });
});
const getGroupSchedulePreventives = catchAsync(async (req, res) => {
    const filter = pick(req.query, [
        'schedulePreventiveStatus',
        'branchs',
        'code',
        'status',
        'importance',
        'preventive',
        'serial',
        'ticketStatus',
        'startDate',
        'endDate',
        'preventiveName',
        'assetStyle',
        'assetModelName',
        'assetName',
        'searchText',
    ]);

    const options = pick(req.query, ['sortBy', 'limit', 'page', 'sortOrder']);
    const { _schedulePreventives, totalResults, assignedSchedules } =
        await schedulePreventiveService.queryGroupSchedulePreventives(filter, options, req.user.id);
    const schedulePreventives = await Promise.all(
        _schedulePreventives.map(async (item) => {
            const schedulePreventive = item;
            // Lấy danh sách công việc
            const serviceTasks = await schedulePreventiveService.getSchedulePreventiveTaskByRes({
                schedulePreventive: schedulePreventive._id,
            });
            if (serviceTasks.length > 0) {
                const users = await schedulePreventiveService.getUserIdsByDepartment(req.user.id);
                const serviceTaskObjs = [];
                for (let index = 0; index < serviceTasks.length; index++) {
                    const element = serviceTasks[index].toObject();
                    element.taskItems = await schedulePreventiveService.getSchedulePreventiveTaskItemByRes({
                        schedulePreventiveTask: element._id,
                    });
                    const activeUsers = await schedulePreventiveService.getSchedulePreventiveTaskAssignUserByStatus({
                        schedulePreventiveTask: element._id,
                        status: { $ne: schedulePreventiveTaskAssignUserStatus.replacement },
                        user: { $in: users },
                    });

                    // ✅ Nếu không có user nào thuộc danh sách users -> bỏ task này
                    if (!activeUsers) continue;
                    element.schedulePreventiveTaskAssignUserIsActive = activeUsers;
                    element.schedulePreventiveTaskAssignUserReplacements =
                        await schedulePreventiveService.getSchedulePreventiveTaskAssignUserByRes({
                            schedulePreventiveTask: element._id,
                            status: schedulePreventiveTaskAssignUserStatus.replacement,
                        });
                    serviceTaskObjs.push(element);
                }
                schedulePreventive.schedulePreventiveTasks = serviceTaskObjs;
            } else {
                schedulePreventive.schedulePreventiveTasks = [];
            }
            // Lấy spare parts
            const schedulePreventiveSpareParts = await schedulePreventiveService.getSchedulePreventiveSparePartByRes({
                schedulePreventive: schedulePreventive._id,
            });
            schedulePreventive.schedulePreventiveSparePart = schedulePreventiveSpareParts;
            schedulePreventive.totalDownTimeSchedulePreventive =
                await schedulePreventiveService.totalDownTimeSchedulePreventive(schedulePreventive._id);
            return schedulePreventive;
        })
    );
    res.send({ code: 1, ...totalResults, schedulePreventives });
});
const getAssetSchedulePreventivetHistorys = catchAsync(async (req, res) => {
    const filter = pick(req.body, [
        'assetMaintenance',
        'statuses',
        'code',
        'importance',
        'assetStyle',
        'startDate',
        'endDate',
        'preventiveName',
    ]);
    const options = pick(req.body, ['sortBy', 'sortOrder', 'limit', 'page']);
    const schedulePreventives = await schedulePreventiveService.getAssetSchedulePreventivetHistorys(filter, options);
    res.send({ schedulePreventives, code: 1 });
});
const getDowntimeByShedulePreventiveAssignUser = catchAsync(async (req, res) => {
    const { downtimeHr, downtimeMin } = await schedulePreventiveService.getDowntimeByShedulePreventiveAssignUser(
        req.params.id,
        req.user.id
    );
    res.send({ code: 1, downtimeHr, downtimeMin });
});
module.exports = {
    createSchedulePreventive,
    getSchedulePreventivees,
    getSchedulePreventiveById,
    updateSchedulePreventive,
    deleteSchedulePreventive,
    confirmSchedulePreventiveUser,
    cancelConfirmSchedulePreventiveUser,
    schedulePreventiveCheckInOut,
    schedulePreventiveTaskAssignUser,
    getMySchedulePreventivees,
    getSchedulePreventiveTaskAssignUserById,
    comfirmCancelSchedulePreventive,
    comfirmCloseSchedulePreventive,
    comfirmReOpenSchedulePreventive,
    getCurrentCheckinCheckout,
    checkinSchedulePreventiveTask,
    checkOutSchedulePreventiveTask,
    startWorkschedulePreventiveTask,
    getTotalSchedulePreventiveStatus,
    getTotalMySchedulePreventiveStatus,
    createSchedulePreventiveComment,
    getSchedulePreventiveComments,
    getGroupSchedulePreventives,
    getAssetSchedulePreventivetHistorys,
    getDowntimeByShedulePreventiveAssignUser,
};
