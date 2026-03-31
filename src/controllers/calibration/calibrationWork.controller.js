const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const catchAsync = require('../../utils/catchAsync');
const ApiError = require('../../utils/ApiError');
const { calibrationWorkService, breakdownService, schedulePreventiveService, userService, approvalTaskService, assetMaintenanceService } = require('../../services');
const { CalibrationWorkAssignUserModel } = require('../../models');
const { calibrationWorkAssignUserStatus, notificationTypeCode, progressStatus, workAsset } = require('../../utils/constant');
const notificationService = require('../../services/notification/notification.service');
/**
 * Create a user
 * @type {(function(*, *, *): void)|*}
 */
const createCalibrationWork = catchAsync(async (req, res) => {
    const payload = {};
    const createCalibrationWork = await calibrationWorkService.createCalibrationWork(payload);
    res.status(httpStatus.CREATED).send({ code: 1, createCalibrationWork });
});
const getCalibrationWorks = catchAsync(async (req, res) => {
    const options = pick(req.body, ['sortBy', 'sortOrder', 'limit', 'page']);
    const filter = pick(req.body, [
        'serial',
        'status',
        'code',
        'importance',
        'assetStyle',
        'assetModelName',
        'assetName',
        'calibrationName',
        'groupStatus',
        'startDate',
        'endDate',
        'searchText',
        'branchs',
    ]);
    const { calibrations, totalResults } = await calibrationWorkService.queryCalibrationWorks(filter, options, req);
    const calibrationWithTasks = await Promise.all(
        calibrations.map(async (calibrationWork) => {
            const serviceObj = calibrationWork;
            serviceObj.assignUsers = await calibrationWorkService.getCalibrationWorkAssignUserByRes({
                calibrationWork: serviceObj._id,
            });
            return serviceObj;
        })
    );

    res.send({ code: 1, ...totalResults, results: calibrationWithTasks });
});
const comfirmCancelCalibrationWorkById = catchAsync(async (req, res) => {
    const calibrationWork = await calibrationWorkService.comfirmCancelCalibrationWorkById(req.params.id);
    const history = await calibrationWorkService.getCalibrationWorkTimelineByRes({ calibrationWork: calibrationWork._id });
    const payloadTimeline = {
        calibrationWork: calibrationWork._id,
        oldStatus: history ? history.status : 'null',
        status: progressStatus.cancelled,
        workedBy: req.user.id,
        workedDate: Date.now(),
    };
    await calibrationWorkService.createCalibrationWorkTimeline(payloadTimeline);
    res.send({ code: 1, calibrationWork });
});
const deleteCalibrationWorkById = catchAsync(async (req, res) => {
    const calibrationWork = await calibrationWorkService.deleteCalibrationWorkById(req.params.id);
    res.send({ code: 1, calibrationWork });
});
const assignUser = catchAsync(async (req, res) => {
    const { user, calibrationWork } = req.body;
    const _calibrationWork = await calibrationWorkService.createCalibrationWorkAssignUser(user, calibrationWork);
    const payloadTimeline = {
        calibrationWork: calibrationWork,
        oldStatus: progressStatus.new,
        status: progressStatus.assigned,
        designatedUser: user,
        workedBy: req.user.id,
        workedDate: Date.now(),
    };
    await calibrationWorkService.createCalibrationWorkTimeline(payloadTimeline);
    res.send({ code: 1, _calibrationWork });
});
const reassignmentCalibrationWorkAssignUser = catchAsync(async (req, res) => {
    const { user, oldUser, calibrationWork } = req.body;
    const calibrationWorkAssignUser = await calibrationWorkService.reassignmentCalibrationWorkAssignUser(
        user,
        oldUser,
        calibrationWork
    );
    if (calibrationWorkAssignUser && calibrationWorkAssignUser?.calibrationWork) {
        const _calibrationWork = await calibrationWorkService.getCalibrationWorkByIdNotPopulate(
            calibrationWorkAssignUser?.calibrationWork
        );
        const payloadNoti = {
            notificationTypeCode: notificationTypeCode.assign_user_calibration_work,
            text: `Bạn nhận được công việc hiệu chuẩn, code : ${_calibrationWork.code}`,
            subUrl: `my-calibration-work/detail/${calibrationWorkAssignUser._id}`,
            webSubUrl: `calibration/calibration-work/view/${calibrationWorkAssignUser.calibrationWork}`,
            notificationName: 'Phân công công việc hiệu chuẩn',
            user: user,
        };
        await notificationService.pushNotificationWithUser(payloadNoti);
    }

    const history = await calibrationWorkService.getCalibrationWorkTimelineByRes({ calibrationWork: calibrationWork });
    const payloadTimeline = {
        calibrationWork: calibrationWork,
        oldStatus: history ? history.status : 'null',
        status: progressStatus.reassignment,
        workedBy: req.user.id,
        workedDate: Date.now(),
        designatedUser: user,
    };
    await calibrationWorkService.createCalibrationWorkTimeline(payloadTimeline);

    res.send({ code: 1, calibrationWorkAssignUser });
});
const getCalibrationWorkById = catchAsync(async (req, res) => {
    const calibrationWork = await calibrationWorkService.getCalibrationWorkById(req.params.id);
    const calibrationWorkAssignUser = await calibrationWorkService.getCalibrationWorkAssignUserByRes({
        calibrationWork: req.params.id,
    });
    const calibrationWorkTimeline = await calibrationWorkService.getAllCalibrationWorkTimelines({
        calibrationWork: req.params.id,
    });
    const workId = calibrationWorkAssignUser[0]?.calibrationWork;
    let lastCheckInCheckOut = null;
    if (workId) {
        lastCheckInCheckOut = await calibrationWorkService.getLastCalibrationWorkCheckinCheckOut({
            calibrationWork: {
                _id: calibrationWorkAssignUser[0]?.calibrationWork || null,
            }
        });
    }
    res.send({ code: 1, calibrationWork, calibrationWorkAssignUser, lastCheckInCheckOut, calibrationWorkTimeline });
});
const getMyCalibrationWorks = catchAsync(async (req, res) => {
    const filter = pick(req.body, [
        'calibrationWorkAssignUserStatuses',
        'calibrationWorkAssignUserGroupStatus',
        'code',
        'serial',
        'branchs',
        'calibrationWorkAssignUserStatus',
        'startDate',
        'endDate',
        'calibrationName',
        'assetName',
        'importance',
        'assetModelName',
        'searchText',
        'status',
    ]);
    const options = pick(req.body, ['sortBy', 'sortOrder', 'limit', 'page']);
    const user = req.user.id;
    const { myCalibrationWorks, totalResults } = await calibrationWorkService.queryMyCalibrationWorks(filter, options, user);
    const myCalibrationWorkAssignUsers = await Promise.all(
        myCalibrationWorks.map(async (item) => {
            const resultObj = item; // đổi tên
            resultObj.assignUsers = await calibrationWorkService.getCalibrationWorkAssignUserByRes({
                calibrationWork: item.calibrationWork?._id,
            });
            return resultObj;
        })
    );
    res.send({ code: 1, myCalibrationWorkAssignUsers, ...totalResults });
});
const comfirmAcceptCalibrationWork = catchAsync(async (req, res) => {
    const calibrationWork = await calibrationWorkService.comfirmAcceptCalibrationWork(req.body.calibrationWork, req.user.id);
    const history = await calibrationWorkService.getCalibrationWorkTimelineByRes({ calibrationWork: req.body.calibrationWork });
    const payloadTimeline = {
        calibrationWork: req.body.calibrationWork,
        oldStatus: history ? history.status : 'null',
        status: progressStatus.accepted,
        workedBy: req.user.id,
        workedDate: Date.now(),
    };
    await calibrationWorkService.createCalibrationWorkTimeline(payloadTimeline);

    // chuyển assetMaintenance về trạng thái về tạm dừng
    // const calibrationWorkd = await calibrationWorkService.getCalibrationWorkByIdNotPopulate(req.body.calibrationWork)
    // if (calibrationWorkd) {
    //     await assetMaintenanceService.updatePauseAsset(calibrationWorkd.assetMaintenance, req.user.id, calibrationWorkd._id);
    // }

    res.send({ code: 1, calibrationWork });
});
const comfirmRejectCalibrationWork = catchAsync(async (req, res) => {
    const { calibrationWork, reasonsForRefusal } = req.body;
    const _calibrationWork = await calibrationWorkService.comfirmRejectCalibrationWork(
        calibrationWork,
        req.user.id,
        reasonsForRefusal
    );
    const history = await calibrationWorkService.getCalibrationWorkTimelineByRes({ calibrationWork: calibrationWork });
    const payloadTimeline = {
        calibrationWork: calibrationWork,
        oldStatus: history ? history.status : 'null',
        status: progressStatus.rejected,
        workedBy: req.user.id,
        workedDate: Date.now(),
        comment: reasonsForRefusal,
    };
    await calibrationWorkService.createCalibrationWorkTimeline(payloadTimeline);
    res.send({ code: 1, _calibrationWork });
});
const getCalibrationWorkAssignUserById = catchAsync(async (req, res) => {
    const calibrationWorkAssignUser = await calibrationWorkService.getCalibrationWorkAssignUserById(req.params.id);
    const breakdowns = await breakdownService.getBreakdownByRes({
        calibrationWorkAssignUser: calibrationWorkAssignUser._id,
    });
    const lastCheckInCheckOut = await calibrationWorkService.getLastCalibrationWorkCheckinCheckOut({
        calibrationWork: calibrationWorkAssignUser?.calibrationWork,
    });
    const { listDocuments, checkInOutList } = await calibrationWorkService.getDataByCalibrationWorkAssignUser(
        calibrationWorkAssignUser._id
    );
    res.send({ code: 1, calibrationWorkAssignUser, breakdowns, lastCheckInCheckOut, listDocuments, checkInOutList });
});
const calibratedComfirm = catchAsync(async (req, res) => {
    const data = req.body;
    data.user = req.user.id;
    const calibrationWorkAssignUser = await calibrationWorkService.calibratedComfirm(data);
    if (calibrationWorkAssignUser && calibrationWorkAssignUser?.calibrationWork) {
        const calibrationWork = await calibrationWorkService.getCalibrationWorkById(
            calibrationWorkAssignUser?.calibrationWork
        );
        const user = await userService.getUserById(req.user.id);
        const payload = {
            notificationTypeCode: notificationTypeCode.calibration_work_completed,
            text: `Kỹ sư ${user?.fullName} đã hoàn thành${data?.isProblem ? ' một phần' : ''} công việc hiệu chuẩn : ${calibrationWork.code
                }`,
            subUrl: `calibration-work/detail/${calibrationWork._id}`,
            webSubUrl: `calibration/calibration-work/view/${calibrationWork._id}`,
            notificationName: 'Hoàn thành công việc hiệu chuẩn',
        };
        await notificationService.pushNotification(payload);
    }
    const history = await calibrationWorkService.getCalibrationWorkTimelineByRes({ calibrationWork: calibrationWorkAssignUser?.calibrationWork });
    const payloadTimeline = {
        calibrationWork: calibrationWorkAssignUser?.calibrationWork,
        oldStatus: history ? history.status : 'null',
        status: data?.isProblem ? progressStatus.partiallyCompleted : progressStatus.completed,
        workedBy: req.user.id,
        workedDate: Date.now(),
    };
    await calibrationWorkService.createCalibrationWorkTimeline(payloadTimeline);
    res.send({ code: 1, calibrationWorkAssignUser });
});
const comfirmCloseCalibrationWork = catchAsync(async (req, res) => {
    const data = req.body;
    const calibrationWork = await calibrationWorkService.comfirmCloseCalibrationWork(data, req.user.id);
    const payload = {
        processedAt: new Date(),
        processedBy: req.user.id,
        status: "PROCESSED"
    }
    await approvalTaskService.updateApprovalTaskBySourceId(data.calibrationWork, payload);
    const history = await calibrationWorkService.getCalibrationWorkTimelineByRes({ calibrationWork: data.calibrationWork });
    const payloadTimeline = {
        calibrationWork: data.calibrationWork,
        oldStatus: history ? history.status : 'null',
        status: progressStatus.cloesed,
        workedBy: req.user.id,
        workedDate: Date.now(),
        comment: data.note,
    };
    await calibrationWorkService.createCalibrationWorkTimeline(payloadTimeline);

    // update trạng thái assetMaintenance về active
    if (calibrationWork) {
        await assetMaintenanceService.updateActiveAsset(calibrationWork.assetMaintenance, req.user.id, calibrationWork._id, workAsset.calibrationWork);
    }

    res.send({ code: 1, calibrationWork });
});
const comfirmReOpenCalibrationWork = catchAsync(async (req, res) => {
    const data = req.body;
    const calibrationWork = await calibrationWorkService.comfirmReOpenCalibrationWork(data);
    const payload = {
        processedAt: new Date(),
        processedBy: req.user.id,
        status: "PROCESSED"
    }
    await approvalTaskService.updateApprovalTaskBySourceId(data.calibrationWork, payload);

    const history = await calibrationWorkService.getCalibrationWorkTimelineByRes({ calibrationWork: data.calibrationWork });
    const payloadTimeline = {
        calibrationWork: data.calibrationWork,
        oldStatus: history ? history.status : 'null',
        status: progressStatus.reopen,
        workedBy: req.user.id,
        workedDate: Date.now(),
        comment: data.reasonForReopening,
    };
    await calibrationWorkService.createCalibrationWorkTimeline(payloadTimeline);
    res.send({ code: 1, calibrationWork });
});
const getAllCalibrationWorkHistorys = catchAsync(async (req, res) => {
    const calibrationWorkHistorys = await calibrationWorkService.getAllCalibrationWorkHistorys({
        calibrationWork: req.params.id,
    });
    // const result = await Promise.all(
    //     calibrationWorkHistorys.map(async (item) => {
    //         const breakdown = await breakdownService.getBreakdownByResFindOne({
    //             calibrationWork: req.params.id,
    //             calibrationWorkAssignUser: item.calibrationWorkAssignUser?._id,
    //         });
    //         return {
    //             ...item.toObject(),
    //             breakdown,
    //         };
    //     })
    // );
    res.send({ code: 1, calibrationWorkHistorys });
});
const getCurrentCalibrationWorkCheckinCheckout = catchAsync(async (req, res) => {
    const currentCheckinCheckout = await calibrationWorkService.getCurrentCalibrationWorkCheckinCheckout(req.user.id);
    res.send({ code: 1, data: currentCheckinCheckout });
});
const checkinCalibrationWork = catchAsync(async (req, res) => {
    const { calibrationWork } = req.body;
    const currentCheckinCheckout = await calibrationWorkService.getCurrentCalibrationWorkCheckinCheckout(req.user.id);
    if (currentCheckinCheckout)
        throw new ApiError(httpStatus.EXPECTATION_FAILED, 'Kỹ thuật viên đang thực hiện công việc khác!');
    const calibrationWorkCheckinCheckOut = await calibrationWorkService.checkinCalibrationWork(calibrationWork, req.user.id);
    const history = await calibrationWorkService.getCalibrationWorkTimelineByRes({ calibrationWork: calibrationWork });
    const payloadTimeline = {
        calibrationWork: calibrationWork,
        oldStatus: history ? history.status : 'null',
        status: progressStatus.inProgress,
        loginDate: Date.now(),
        workedBy: req.user.id,
        workedDate: Date.now(),
    };
    await calibrationWorkService.createCalibrationWorkTimeline(payloadTimeline);

    // 
    const calibrationWorkd = await calibrationWorkService.getCalibrationWorkByIdNotPopulate(req.body.calibrationWork)
    if (calibrationWorkd) {
        await assetMaintenanceService.updatePauseAsset(calibrationWorkd.assetMaintenance, req.user.id, calibrationWorkd._id);
    }

    res.send({ code: 1, data: calibrationWorkCheckinCheckOut, message: 'Check-in thành công' });
});
const checkOutCalibrationWork = catchAsync(async (req, res) => {
    const { calibrationWorkCheckinCheckOutId, comment, calibrationWork } = req.body;
    const currentCheckinCheckout = await calibrationWorkService.getCurrentCalibrationWorkCheckinCheckout(req.user.id);
    if (!currentCheckinCheckout)
        throw new ApiError(httpStatus.EXPECTATION_FAILED, 'Kỹ thuật viên chưa thực hiện công việc!');
    if (currentCheckinCheckout.id !== calibrationWorkCheckinCheckOutId)
        throw new ApiError(httpStatus.EXPECTATION_FAILED, 'Kỹ thuật viên chưa thực hiện công việc!');
    const calibrationWorkCheckinCheckOut = calibrationWorkService.checkOutcalibrationWork(
        calibrationWorkCheckinCheckOutId,
        comment,
        req.user.id
    );
    const history = await calibrationWorkService.getCalibrationWorkTimelineByRes({ calibrationWork: calibrationWork });
    const payloadTimeline = {
        calibrationWork: calibrationWork,
        oldStatus: history ? history.status : 'null',
        status: progressStatus.inProgress,
        logoutDate: Date.now(),
        workedBy: req.user.id,
        workedDate: Date.now(),
    };
    await calibrationWorkService.createCalibrationWorkTimeline(payloadTimeline);
    res.send({ code: 1, data: calibrationWorkCheckinCheckOut });
});
const createCalibrationWorkComment = catchAsync(async (req, res) => {
    const payload = {
        ...req.body,
        createdBy: req.user.id,
    };
    const createCalibrationWork = await calibrationWorkService.createCalibrationWorkComment(payload);
    res.status(httpStatus.CREATED).send({ code: 1, createCalibrationWork });
});
const getCalibrationWorkComments = catchAsync(async (req, res) => {
    const filter = pick(req.body, ['comments', 'calibrationWork']);
    const options = pick(req.body, ['sortBy', 'limit', 'page']);
    const result = await calibrationWorkService.getCalibrationWorkComments(filter, options);
    res.send({ code: 1, result });
});
const queryGroupCalibrationWorks = catchAsync(async (req, res) => {
    const filter = pick(req.body, [
        'calibrationWorkAssignUserStatuses',
        'calibrationWorkAssignUserGroupStatus',
        'code',
        'serial',
        'branchs',
        'calibrationWorkAssignUserStatus',
        'startDate',
        'endDate',
        'calibrationName',
        'assetName',
        'importance',
        'assetModelName',
        'searchText',
        'status'
    ]);
    const options = pick(req.body, ['sortBy', 'sortOrder', 'limit', 'page']);
    const user = req.user.id;

    const { myCalibrationWorks, totalResults } = await calibrationWorkService.queryGroupCalibrationWorks(
        filter,
        options,
        user
    );
    const myCalibrationWorkAssignUsers = await Promise.all(
        myCalibrationWorks.map(async (item) => {
            const resultObj = item; // đổi tên
            resultObj.assignUsers = await calibrationWorkService.getCalibrationWorkAssignUserByRes({
                calibrationWork: item.calibrationWork?._id,
            });
            return resultObj;
        })
    );
    res.send({ code: 1, myCalibrationWorkAssignUsers, ...totalResults });
});
const getTotalCalibrationWorkByGroupStatus = catchAsync(async (req, res) => {
    const filter = pick(req.body, ['branchs']);
    const totalCalibrationWorkByGroupStatus = await calibrationWorkService.getTotalCalibrationWorkByGroupStatus(filter, req);
    res.send({ code: 1, totalCalibrationWorkByGroupStatus });
});
const getTotalCalibrationWorkAssignUserByStatus = catchAsync(async (req, res) => {
    const totalCalibrationWorkAssignUserByStatus = await calibrationWorkService.getTotalCalibrationWorkAssignUserByStatus(
        req.user.id
    );
    res.send({ code: 1, totalCalibrationWorkAssignUserByStatus });
});
const getAssetCalibrationWorkHistorys = catchAsync(async (req, res) => {
    const filter = pick(req.body, [
        'assetMaintenance',
        'statuses',
        'code',
        'importance',
        'assetStyle',
        'startDate',
        'endDate',
        'calibrationName',
    ]);
    const options = pick(req.body, ['sortBy', 'sortOrder', 'limit', 'page']);
    const calibrationWorks = await calibrationWorkService.getAssetCalibrationWorkHistorys(filter, options);
    res.send({ calibrationWorks, code: 1 });
});

const getCalibrationWorkHistory = catchAsync(async (req, res) => {
    const calibrationWorkHistory = await calibrationWorkService.getCalibrationWorkHistory(req.query.id);
    res.send({ data: calibrationWorkHistory, code: 1 });
});
const updateCalibratedComfirm = catchAsync(async (req, res) => {
    const data = req.body;
    data.user = req.user.id;
    const calibrationWorkAssignUser = await calibrationWorkService.updateCalibratedComfirm(data);
    res.send({ code: 1, calibrationWorkAssignUser });
});
const getDownTimeByCalibrationWorkAssignUser = catchAsync(async (req, res) => {
    const { downtimeHr, downtimeMin } = await calibrationWorkService.getDownTimeByCalibrationWorkAssignUser(req.params.id);
    res.send({ code: 1, downtimeHr, downtimeMin });
});
module.exports = {
    createCalibrationWork,
    getCalibrationWorks,
    comfirmCancelCalibrationWorkById,
    deleteCalibrationWorkById,
    assignUser,
    reassignmentCalibrationWorkAssignUser,
    getCalibrationWorkById,
    getMyCalibrationWorks,
    comfirmRejectCalibrationWork,
    comfirmAcceptCalibrationWork,
    getCalibrationWorkAssignUserById,
    calibratedComfirm,
    comfirmCloseCalibrationWork,
    comfirmReOpenCalibrationWork,
    getAllCalibrationWorkHistorys,
    getCurrentCalibrationWorkCheckinCheckout,
    checkinCalibrationWork,
    checkOutCalibrationWork,
    createCalibrationWorkComment,
    getCalibrationWorkComments,
    queryGroupCalibrationWorks,
    getTotalCalibrationWorkByGroupStatus,
    getTotalCalibrationWorkAssignUserByStatus,
    getAssetCalibrationWorkHistorys,
    getCalibrationWorkHistory,
    updateCalibratedComfirm,
    getDownTimeByCalibrationWorkAssignUser,
};
