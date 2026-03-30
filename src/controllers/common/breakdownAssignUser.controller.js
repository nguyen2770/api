const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const {
    breakdownAssignUserService,
    breakdownAssignUserRepairService,
    breakdownService,
    assetMaintenanceIsNotActiveHistoryService,
    approvalTaskService,
    userService,
    assetMaintenanceService,
} = require('../../services');
const notificationService = require('../../services/notification/notification.service');
const ApiError = require('../../utils/ApiError');

const config = require('../../config/config');
const {
    breakdownAssignUserStatus,
    ticketBreakdownStatus,
    progressStatus,
    breakdownStatus,
    notificationTypeCode,
    approvedTaskType,
} = require('../../utils/constant');
const { Breakdown, ApprovalTaskModel } = require('../../models');

/**
 * Create a user
 * @type {(function(*, *, *): void)|*}
 */
const createBreakdownAssignUser = catchAsync(async (req, res) => {
    const data = {
        ...req.body,
        createdBy: req.user.id,
    };
    let results = [];
    const breakDown = await breakdownService.getBreakdownByIdNoPopulate(data.breakdown);
    if (Array.isArray(data.user)) {
        results = await Promise.all(
            data.user.map(async (user) => {
                const history = await breakdownService.getBreakdownHistoryByRes({ breakdown: data.breakdown });
                const payloadHistory = {
                    ...data,
                    oldStatus: history ? history.status : 'null',
                    status: breakdownAssignUserStatus.assigned,
                    workedDate: Date.now(),
                    indicaltedUserBy: req.user.id,
                    workedBy: user,
                    comment: data.comments,
                };
                await breakdownService.createBreakdownHistory(payloadHistory);
                const item = { ...data, user };
                // tạo thông báo
                const payloadNoti = {
                    notificationTypeCode: notificationTypeCode.assign_user_breakdown,
                    text: `Bạn nhận được công việc mới: ${breakDown.code}`,
                    subUrl: `view-my-breakdown/${breakDown._id}`,
                    webSubUrl: `breakdown/work-order-breakdown/view/${breakDown._id}`,
                    notificationName: 'Bạn nhận được công việc mới',
                    user: user,
                };
                await notificationService.pushNotificationWithUser(payloadNoti);
                return breakdownAssignUserService.createBreakdownAssignUser(item);
                // lấy thông tin các máy đang đăng nhập
            })
        );
    }
    // else {
    //     const breakdown = await breakdownAssignUserService.createBreakdownAssignUser(data);
    //     results.push(breakdown);
    // }
    if (data.comments) {
        await breakdownAssignUserService.createBreakComment(data);
    }
    if (data.breakdown) {
        await breakdownService.updateBreakdownById(data.breakdown, {
            status: breakdownStatus.assigned,
            responseTime: Date.now(),
        });
    }
    res.status(httpStatus.CREATED).send({ code: 1, results });
});

const createBreakdownAssignUserRepair = catchAsync(async (req, res) => {
    const { beakdownAssignUserRepair, listAttachment } = req.body.data;

    await breakdownAssignUserRepairService.createBreakdownAssignUserRepair({
        ...beakdownAssignUserRepair,
        createdBy: req.user.id,
    });
    if (listAttachment && Array.isArray(listAttachment)) {
        // eslint-disable-next-line no-restricted-syntax
        for (const attachment of listAttachment) {
            attachment.breakdownAssignUserRepair = beakdownAssignUserRepair._id;
            attachment.breakdownAssignUser = beakdownAssignUserRepair.breakdownAssignUser;
            // Gọi service để tạo attachment
            // eslint-disable-next-line no-await-in-loop
            await breakdownAssignUserRepairService.createBreakdownAssignUserAttachment(attachment);
        }
    }
    if (beakdownAssignUserRepair.breakdownAssignUser) {
        const asignUser = await breakdownAssignUserService.updateStatus(beakdownAssignUserRepair.breakdownAssignUser, {
            ticketStatus: ticketBreakdownStatus.inProgress,
            status: progressStatus.experimentalFix,
            // completedDate: Date.now(),
        });

        // thêm vào bảng duyệt nhanh nếu trạng thái của asign user là experimentalFix
        const breakdown = await Breakdown.findById(asignUser.breakdown);
        if (asignUser) {
            await approvalTaskService.createApprovalTask({
                sourceType: approvedTaskType.trial_repair_approval,
                sourceId: beakdownAssignUserRepair.breakdownAssignUser,
                title: 'Duyệt sự cố đã sửa thử nghiệm',
                description: `Mã sự cố ${breakdown.code}`,
                requestUser: req.user.id,
            });
        }
    }

    const lastCheckInCheckOut = await breakdownAssignUserService.getLatestBreakdownAssignUserCheckInCheckOut({
        breakdownAssignUser: beakdownAssignUserRepair.breakdownAssignUser,
    });
    if (!lastCheckInCheckOut || lastCheckInCheckOut.logOutAt) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Chưa check in');
    }
    const payloadUpdate = {
        logOutAt: Date.now(),
    };
    await breakdownAssignUserService.updateBreakdownAssignUserCheckInCheckOut(lastCheckInCheckOut.id, payloadUpdate);
    const breakdownAssignUser = await breakdownAssignUserService.getBreakdownAssignUserById(
        beakdownAssignUserRepair.breakdownAssignUser
    );
    if (breakdownAssignUser) {
        const payload = {
            ticketStatus: ticketBreakdownStatus.inProgress,
            status: breakdownStatus.inProgress,
        };
        if (beakdownAssignUserRepair.downTimeMilis != null) {
            payload.downTimeMilis = beakdownAssignUserRepair.downTimeMilis;
        }
        await breakdownService.updateBreakdownById(breakdownAssignUser.breakdown, payload);
        const history = await breakdownService.getBreakdownHistoryByRes({
            workedBy: req.user.id,
            breakdown: breakdownAssignUser.breakdown,
        });
        const payloadHistory = {
            oldStatus: history ? history.status : 'null',
            status: progressStatus.experimentalFix,
            workedDate: Date.now(),
            workedBy: req.user.id,
            breakdownAssignUser: breakdownAssignUser._id,
            breakdown: breakdownAssignUser.breakdown,
        };
        await breakdownService.createBreakdownHistory(payloadHistory);

        if (breakdownAssignUser?.breakdown) {
            const breakdown = await breakdownService.getBreakdownByIdNoPopulate(breakdownAssignUser?.breakdown);
            const user = await userService.getUserById(req.user.id);

            const params = new URLSearchParams({ ticketStatus: 'hasOpened' });
            const notificationContent = {
                notificationTypeCode: notificationTypeCode.repair_and_testing_completed,
                isNotifyTheManager: true,
                text: `Kỹ sư ${user.fullName} đã hoàn thành sửa thử nghiệm sự cố : ${breakdown.code}`,
                subUrl: `view-my-breakdown/${breakdown._id}?${params.toString()}`,
                webSubUrl: `breakdown/work-order-breakdown/view/${breakdown._id}`,
                notificationName: 'Sửa chữa thử nghiệm sự cố',
            };
            await notificationService.pushNotification(notificationContent);
        }
    }
    res.send({ code: 1 });
});

const getBreakdownAssignUserByBreakdownId = catchAsync(async (req, res) => {
    const query = {
        breakdown: req.query.id,
        user: req.user.id,
    };
    const breakdownAssignUser = await breakdownAssignUserService.getBreakdownAssignUserByBreakdownId(query);
    if (!breakdownAssignUser) {
        throw new ApiError(httpStatus.NOT_FOUND, 'breakdownAssignUser not found');
    }
    // lay check in checkout
    const checkInCheckOuts = await breakdownAssignUserService.getCheckInCheckOutsByBreakdownIdUserId({
        breakdownAssignUser: breakdownAssignUser._id,
    });
    const lastCheckInCheckOut = await breakdownAssignUserService.getLatestBreakdownAssignUserCheckInCheckOut({
        breakdownAssignUser: breakdownAssignUser._id,
    });
    const lastCheckInCheckOutByUser = await breakdownAssignUserService.getLatestBreakdownAssignUserCheckInCheckOut({
        user: req.user.id,
    });
    res.send({
        code: 1,
        data: {
            breakdownAssignUser,
            checkInCheckOuts,
            lastCheckInCheckOut,
            lastCheckInCheckOutByUser,
        },
    });
});

const checkInBreakdown = catchAsync(async (req, res) => {
    const lastCheckInCheckOut = await breakdownAssignUserService.getLatestBreakdownAssignUserCheckInCheckOut({
        breakdownAssignUser: req.params.breakdownAssignUserId,
    });
    //đăng nhập vào sự cố nếu sự cố đang gửi phụ tùng thì giữ nguyên trạng thái còn lại chuyển sang đang tiến hành
    const breakdownAssignUser = await breakdownAssignUserService.getBreakdownAssignUserById(
        req.params.breakdownAssignUserId
    );
    if (breakdownAssignUser.status !== 'approved') {
        await breakdownService.updateBreakdownById(breakdownAssignUser.breakdown, {
            ticketStatus: ticketBreakdownStatus.inProgress,
            status: breakdownAssignUserStatus.inProgress,
        });
        await breakdownAssignUserService.updateStatus(req.params.breakdownAssignUserId, {
            status: breakdownAssignUserStatus.inProgress,
        });
    }
    const checkIncidentDeadline = await Breakdown.findById(breakdownAssignUser?.breakdown?._id);
    if (!checkIncidentDeadline.incidentDeadline && breakdownAssignUser) {
        await Breakdown.findByIdAndUpdate(breakdownAssignUser.breakdown._id, {
            incidentDeadline: req.body.estimatedCompletionDate || breakdownAssignUser.estimatedCompletionDate
        });
    }
    if (!lastCheckInCheckOut) {
        await breakdownAssignUserService.updateStatus(req.params.breakdownAssignUserId, {
            estimatedCompletionDate: req.body.estimatedCompletionDate,
        });
    }
    if (!lastCheckInCheckOut || lastCheckInCheckOut.logOutAt) {
        const newCheckInCheckOut = {
            breakdownAssignUser: req.params.breakdownAssignUserId,
            breakdown: breakdownAssignUser.breakdown,
            logInAt: Date.now(),
            user: req.user._id,
        };
        await breakdownAssignUserService.createCheckinCheckout(newCheckInCheckOut);
        // // cập nhật lại trạng thái breakdown
        // await breakdownAssignUserService.updateStatus(req.params.breakdownAssignUser, { status: breakdownAssignUserStatus.inProgress })
    } else {
        throw new ApiError(httpStatus.NOT_FOUND, 'Đã login');
    }
    if (breakdownAssignUser) {
        const history = await breakdownService.getBreakdownHistoryByRes({
            workedBy: req.user.id,
            breakdown: breakdownAssignUser.breakdown,
        });
        const payloadHistory = {
            oldStatus: history ? history.status : 'null',
            status: progressStatus.inProgress,
            loginDate: Date.now(),
            workedBy: req.user.id,
            breakdownAssignUser: breakdownAssignUser._id,
            // eslint-disable-next-line object-shorthand
            breakdown: breakdownAssignUser.breakdown,
            estimatedCompletionDate: req.body.estimatedCompletionDate,
        };
        await breakdownService.createBreakdownHistory(payloadHistory);
    }
    res.send({ code: 1 });
});
const checkoutBreakdown = catchAsync(async (req, res) => {
    await breakdownAssignUserService.checkoutBreakdown(req.params.breakdownAssignUserId, req.body.checkOutComments);
    res.send({ code: 1 });
});
const getBreakdownAssignUsersByBreakdownId = catchAsync(async (req, res) => {
    const breakdown = await breakdownAssignUserService.getBreakdownAssignUsersByBreakdownId(req.query.id);
    if (!breakdown) {
        throw new ApiError(httpStatus.NOT_FOUND, 'breakdown not found');
    }
    res.send({ code: 1, data: breakdown });
});
const updateBreakdownAssignUser = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body.data;
    const updated = await breakdownAssignUserService.updateStatus(id, updateData);
    res.send({ code: 1, data: updated });
});

const replacementAssignUser = catchAsync(async (req, res) => {
    req.body = {
        ...req.body,
        replacementBy: req.user.id,
    };
    const updated = await breakdownAssignUserService.replacementAssignUser(req.body);
    res.send({ code: 1, data: updated });
});

const requestForSupport = catchAsync(async (req, res) => {
    const updated = await breakdownAssignUserService.requestForSupport(req.body);
    const history = await breakdownService.getBreakdownHistoryByRes({
        workedBy: req.user.id,
        breakdown: req.body.breakdown,
    });
    const payloadHistory = {
        oldStatus: history ? history.status : 'null',
        workedDate: Date.now(),
        workedBy: req.user.id,
        comment: req.body.comment,
        breakdownAssignUser: updated._id,
        status: breakdownAssignUserStatus.requestForSupport,
        breakdown: req.body.breakdown,
    };
    await breakdownService.createBreakdownHistory(payloadHistory);
    if (updated && updated.breakdown) {
        const breakdown = await breakdownService.getBreakdownByIdNoPopulate(updated.breakdown);
        const user = await userService.getUserById(req.user.id);
        const params = new URLSearchParams({ ticketStatus: 'hasOpened' });
        const notificationContent = {
            notificationTypeCode: notificationTypeCode.request_for_support_breakdown,
            isNotifyTheManager: true,
            text: `Kỹ sư ${user?.fullName} yêu cầu hỗ trợ sự cố : ${breakdown.code}`,
            subUrl: `view-my-breakdown/${breakdown._id}?${params.toString()}`,
            webSubUrl: `breakdown/work-order-breakdown/view/${breakdown._id}`,
            notificationName: 'Yêu cầu hỗ trợ sự cố',
        };
        await notificationService.pushNotification(notificationContent);
    }
    res.send({ code: 1, data: updated });
});

const comfirmAcceptBreakdownAssignUer = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body.data;
    const data = {
        ...updateData,
    };

    const breakdownAssignUser = await breakdownAssignUserService.getBreakdownAssignUserId(id);
    if (breakdownAssignUser) {
        // Thay đổi trạng thái Breakdwon
        await breakdownService.updateBreakdownById(breakdownAssignUser.breakdown, {
            status: breakdownAssignUserStatus.accepted,
        });
        // Lưu lịch sử
        const history = await breakdownService.getBreakdownHistoryByRes({
            workedBy: req.user.id,
            breakdown: breakdownAssignUser.breakdown,
        });
        const payloadHistory = {
            oldStatus: history ? history.status : 'null',
            workedDate: Date.now(),
            workedBy: req.user.id,
            breakdownAssignUser: breakdownAssignUser._id,
            status: breakdownAssignUserStatus.accepted,
            breakdown: breakdownAssignUser.breakdown,
        };
        await breakdownService.createBreakdownHistory(payloadHistory);
    }
    const breakdown = await breakdownService.getBreakdownByIdNoPopulate(breakdownAssignUser.breakdown);
    // check nếu mà không ở đang tiến hành thì mới  chuyển trạng thái
    if (breakdown.status !== breakdownStatus.inProgress) {
        data.status = breakdownAssignUserStatus.accepted;
    }
    const updated = await breakdownAssignUserService.updateStatus(id, data);
    // tạo thông báo
    const user = await userService.getUserById(req.user.id);
    const params = new URLSearchParams({ ticketStatus: 'hasOpened' });
    const notificationContent = {
        notificationTypeCode: notificationTypeCode.comfirm_accept_breakdown_assign_uer,
        isNotifyTheManager: true, // nếu bằng tru thì cần phải nhập người quản lý để thông báo
        text: `Kỹ sư ${user?.fullName} đã chấp nhận sự cố : ${breakdown.code}`,
        subUrl: `view-my-breakdown/${breakdown._id}?${params.toString()}`,
        webSubUrl: `breakdown/work-order-breakdown/view/${breakdown._id}`,
        notificationName: 'Kỹ sư chấp nhận sự cố',
    };
    await notificationService.pushNotification(notificationContent);

    // chuyển assetMaintenance về trạng thái về tạm dừng
    // if (breakdown) {
    //     await assetMaintenanceService.updatePauseAsset(breakdown.assetMaintenance, req.user.id);
    // }

    res.send({ code: 1, data: updated });
});
const comfirmRefuseBreakdownAssignUer = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body.data;
    const data = {
        ...updateData,
        cancellationTime: Date.now(),
        status: breakdownAssignUserStatus.rejected,
    };
    const breakdownAssignUser = await breakdownAssignUserService.getBreakdownAssignUserId(id);

    if (breakdownAssignUser) {
        // Cập nhập trạng thái của breakdown
        await breakdownService.updateBreakdownById(breakdownAssignUser.breakdown, {
            status: breakdownAssignUserStatus.rejected,
        });
        // lưu lịch sử
        const history = await breakdownService.getBreakdownHistoryByRes({
            workedBy: req.user.id,
            breakdown: breakdownAssignUser.breakdown,
        });
        const payloadHistory = {
            oldStatus: history ? history.status : 'null',
            workedDate: Date.now(),
            workedBy: req.user.id,
            breakdownAssignUser: breakdownAssignUser._id,
            ...updateData,
            status: breakdownAssignUserStatus.rejected,
            breakdown: breakdownAssignUser.breakdown,
        };
        await breakdownService.createBreakdownHistory(payloadHistory);
    }
    const updated = await breakdownAssignUserService.updateStatus(id, data);
    // tạo thông báo
    const breakdown = await breakdownService.getBreakdownByIdNoPopulate(breakdownAssignUser.breakdown);
    const user = await userService.getUserById(req.user.id);
    const params = new URLSearchParams({ ticketStatus: 'hasOpened' });
    const notificationContent = {
        notificationTypeCode: notificationTypeCode.comfirm_refuse_breakdown_assign_user,
        isNotifyTheManager: true, // nếu bằng true thì cần phải nhập người quản lý để thông báo
        text: `Kỹ sư ${user?.fullName} đã từ chối sự cố: ${breakdown.code}`,
        subUrl: `view-my-breakdown/${breakdown._id}?${params.toString()}`,
        webSubUrl: `breakdown/work-order-breakdown/view/${breakdown._id}`,
        notificationName: 'Kỹ sư từ chối sự cố',
    };
    await notificationService.pushNotification(notificationContent);
    res.send({ code: 1, data: updated });
});
const getBreakdownAssignUserById = catchAsync(async (req, res) => {
    const breakdown = await breakdownAssignUserService.getBreakdownAssignUserById(req.query.id);
    if (!breakdown) {
        throw new ApiError(httpStatus.NOT_FOUND, 'breakdown not found');
    }
    // Lấy bản ghi check-in/check-out mới nhất
    const latestCheckInCheckOut = await breakdownAssignUserService.getLatestBreakdownAssignUserCheckInCheckOut({
        breakdownAssignUser: req.query.id,
    });

    res.send({
        data: { breakdown, latestCheckInCheckOut },
        code: 1,
    });
});
const getBreakdownAssignUserByRes = catchAsync(async (req, res) => {
    const breakdown = await breakdownAssignUserService.getBreakdownAssignUserCheckInCheckOutByRes({
        breakdownAssignUser: req.query.id,
    });
    if (!breakdown) {
        throw new ApiError(httpStatus.NOT_FOUND, 'breakdown not found');
    }
    res.send({ data: breakdown, code: 1 });
});

const comfirmBreakdownAssignUserFixed = catchAsync(async (req, res) => {
    const breakdownAssignUser = await breakdownAssignUserService.getBreakdownAssignUserId(req.body.breakdownAssignUser);
    await breakdownAssignUserService.updateStatus(req.body.breakdownAssignUser, { status: progressStatus.WCA, completedDate: Date.now(), });
    const history = await breakdownService.getBreakdownHistoryByRes({
        workedBy: req.user.id,
        breakdown: breakdownAssignUser.breakdown,
    });
    if (breakdownAssignUser) {
        const payloadHistory = {
            oldStatus: history ? history.status : 'null',
            workedDate: Date.now(),
            workedBy: req.user.id,
            breakdownAssignUser: breakdownAssignUser._id,
            comment: req.body.comment,
            status: progressStatus.WCA,
            breakdown: breakdownAssignUser.breakdown,
        };
        await breakdownService.createBreakdownHistory(payloadHistory);
    }
    // check WCA
    if (breakdownAssignUser.breakdown) {
        await breakdownAssignUserService.comfirmBreakdownWWA(breakdownAssignUser.breakdown);
    }
    // const workflow = await workflowService.getWorkflowByRes({ code: codeWorkflow.CLOSE_BREAKDOWN, status: false });
    // if (workflow) {
    //     await breakdownService.updateBreakdownById(breakdownAssignUser.breakdown, { status: progressStatus.cloesed, ticketStatus: ticketBreakdownStatus.cloesed, closingDate: Date.now() });
    //     const payloadHistory = {
    //         oldStatus: history ? history.status : 'null',
    //         workedDate: Date.now(),
    //         workedBy: req.user.id,
    //         breakdownAssignUser: breakdownAssignUser._id,
    //         comment: req.body.comment,
    //         status: progressStatus.cloesed,
    //         breakdown: breakdownAssignUser.breakdown
    //     }
    //     await breakdownService.createBreakdownHistory(payloadHistory);
    // } else {
    //     await breakdownService.updateBreakdownById(breakdownAssignUser.breakdown, { status: progressStatus.WWA, ticketStatus: ticketBreakdownStatus.completed });
    // }

    if (breakdownAssignUser) {
        const payload = {
            processedAt: new Date(),
            processedBy: req.user.id,
            status: 'PROCESSED',
        };
        await approvalTaskService.updateApprovalTaskBySourceId(req.body.breakdownAssignUser, payload);
    }
    res.send({ code: 1 });
});
const getBreakdowUserByBreakdownEndWCA = catchAsync(async (req, res) => {
    const { breakdown } = req.query;
    // Lấy các BreakdownAssignUser có status WCA
    const assignUsers = await breakdownAssignUserService.getBreakdownAssignUserByRes({
        breakdown,
        status: progressStatus.WCA,
    });
    // Lấy tất cả _id của BreakdownAssignUser
    const assignUserIds = assignUsers.map((u) => u._id);
    // Lấy các BreakdownAssignUserRepair liên quan
    const repairs = await breakdownAssignUserRepairService.getRepairsByAssignUserIds(assignUserIds);

    // Lồng repairs vào từng assignUser
    const assignUsersWithRepairs = assignUsers.map((user) => {
        const userRepairs = repairs.filter((r) => r.breakdownAssignUser.toString() === user._id.toString());
        return { ...user.toObject(), repairs: userRepairs };
    });
    res.send({ code: 1, data: assignUsersWithRepairs });
});
const comfirmBreakdownAssignUserFixedMobile = catchAsync(async (req, res) => {
    const { beakdownAssignUserRepair, listAttachment } = req.body.data;
    const _breakdownAssignUserRepair = await breakdownAssignUserRepairService.createBreakdownAssignUserRepair({
        ...beakdownAssignUserRepair,
        createdBy: req.user.id,
    });
    if (listAttachment && Array.isArray(listAttachment)) {
        // eslint-disable-next-line no-restricted-syntax
        for (const attachment of listAttachment) {
            attachment.breakdownAssignUserRepair = _breakdownAssignUserRepair._id;
            attachment.breakdownAssignUser = beakdownAssignUserRepair.breakdownAssignUser;
            // Gọi service để tạo attachment
            // eslint-disable-next-line no-await-in-loop
            await breakdownAssignUserRepairService.createBreakdownAssignUserAttachment(attachment);
        }
    }
    await breakdownAssignUserService.checkoutBreakdown(
        beakdownAssignUserRepair.breakdownAssignUser,
        beakdownAssignUserRepair.comment
    );
    const breakdownAssignUserId = await breakdownAssignUserService.getBreakdownAssignUserId(
        beakdownAssignUserRepair.breakdownAssignUser
    );
    await breakdownAssignUserService.updateStatus(beakdownAssignUserRepair.breakdownAssignUser, {
        status: progressStatus.WCA,
        completedDate: Date.now(),
    });
    if (breakdownAssignUserId) {
        const history = await breakdownService.getBreakdownHistoryByRes({
            workedBy: req.user.id,
            breakdown: breakdownAssignUserId.breakdown,
        });
        const payloadHistory = {
            oldStatus: history ? history.status : 'null',
            workedDate: Date.now(),
            workedBy: req.user.id,
            breakdownAssignUser: breakdownAssignUserId._id,
            comment: beakdownAssignUserRepair.comment,
            status: progressStatus.WCA,
            breakdown: breakdownAssignUserId.breakdown,
        };
        await breakdownService.createBreakdownHistory(payloadHistory);
    }
    // check cho WCA
    if (breakdownAssignUserId.breakdown) {
        // chỉ cần thực hiện đã sửa thì chuyển trạng thái
        const payload = {
            ticketStatus: ticketBreakdownStatus.inProgress,
            status: breakdownStatus.inProgress,
        };
        if (beakdownAssignUserRepair.downTimeMilis != null) {
            payload.downTimeMilis = beakdownAssignUserRepair.downTimeMilis;
        }
        await breakdownService.updateBreakdownById(breakdownAssignUserId.breakdown, payload);
        // thông báo
        const breakdown = await breakdownService.getBreakdownByIdNoPopulate(breakdownAssignUserId.breakdown);
        const user = await userService.getUserById(req.user.id);
        const params = new URLSearchParams({ ticketStatus: 'hasOpened' });
        const notificationContent = {
            notificationTypeCode: notificationTypeCode.repair_completed_breakdown,
            text: `Kỹ sư ${user?.fullName} đã hoàn thành sự cố : ${breakdown.code}`,
            subUrl: `view-my-breakdown/${breakdown._id}?${params.toString()}`,
            webSubUrl: `breakdown/work-order-breakdown/view/${breakdown._id}`,
            notificationName: 'Kỹ sư hoàn thành sự cố',
        };
        await notificationService.pushNotification(notificationContent);
        // check đóng
        await breakdownAssignUserService.comfirmBreakdownWWA(
            breakdownAssignUserId.breakdown,
            req.user.id,
            breakdownAssignUserId
        );
    }
    res.send({ code: 1 });
});
const getTotalMyBreakdownAssignUserStatus = catchAsync(async (req, res) => {
    const totalMyBreakdownAssignUserStatuses = await breakdownAssignUserService.getTotalMyBreakdownAssignUserStatus(
        req.user.id
    );
    res.send({ code: 1, data: totalMyBreakdownAssignUserStatuses });
});
const getTotalEngineerBreakdownAssignUser = catchAsync(async (req, res) => {
    const { allAssignUsers, time } = await breakdownAssignUserService.getTotalEngineerBreakdownAssignUser(
        req.params.breakdownUserAssignId
    );
    res.send({ code: 1, totalEngineerBreakdown: allAssignUsers, time });
});
module.exports = {
    createBreakdownAssignUser,
    getBreakdownAssignUserByBreakdownId,
    updateBreakdownAssignUser,
    replacementAssignUser,
    comfirmAcceptBreakdownAssignUer,
    comfirmRefuseBreakdownAssignUer,
    getBreakdownAssignUserById,
    getBreakdownAssignUserByRes,
    getBreakdownAssignUsersByBreakdownId,
    checkInBreakdown,
    checkoutBreakdown,
    requestForSupport,
    createBreakdownAssignUserRepair,
    comfirmBreakdownAssignUserFixed,
    getBreakdowUserByBreakdownEndWCA,
    comfirmBreakdownAssignUserFixedMobile,
    getTotalMyBreakdownAssignUserStatus,
    getTotalEngineerBreakdownAssignUser,
};
