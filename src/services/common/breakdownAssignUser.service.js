const { breakdownService, assetMaintenanceService } = require('..');
const {
    BreakdownAssignUserModel,
    BreakdownCommentModel,
    BreakdownAssignUserCheckinCheckOutModel,
    BreakdownAssignUserRepairModel,
    BreakdownAssignUserAttachmentModel,
    BreakdownSpareRequest,
    BreakdownSpareRequestDetail,
    WorkflowModel,
    Breakdown,
    BreakdownSpareRequestAssignUserModel,
    AssetMaintenanceIsNotActiveHistoryModel,
    CalibrationWorkAssignUserModel,
    User,
    AssetMaintenance,
    ApprovalTaskModel,
    CalibrationWorkModel,
    PropertyInspectionModel,
    AssetMaintenanceUserModel,
} = require('../../models');
const {
    breakdownAssignUserStatus,
    progressStatus,
    codeWorkflow,
    ticketBreakdownStatus,
    breakdownSpareRequestStatus,
    breakdownSpareRequestDetailStatus,
    schedulePreventiveTaskAssignUserStatus,
    breakdownStatus,
    assetMaintenanceStatus,
    calibrationWorkAssignUserStatus,
    notificationTypeCode,
    approvedTaskType,
    propertyInspectionStatus,
    workAsset,
} = require('../../utils/constant');
const notificationService = require('../notification/notification.service');
const assetMaintenanceIsNotActiveHistoryService = require('./assetMaintenanceIsNotActiveHistory.service');

const config = require('../../config/config');

const createBreakdownAssignUser = async (data) => {
    return BreakdownAssignUserModel.create(data);
};
const getBreakdownAssignUsersByBreakdownId = async (id) => {
    return BreakdownAssignUserModel.find({ breakdown: id }).populate({
        path: 'user',
    });
};
const getBreakdownAssignUserByBreakdownId = async (query) => {
    return BreakdownAssignUserModel.findOne(query).populate([
        {
            path: 'user',
        },
        {
            path: 'repairContract',
        },
    ]);
};
const getCheckInCheckOutsByBreakdownIdUserId = async (query) => {
    return BreakdownAssignUserCheckinCheckOutModel.find(query).populate({
        path: 'user',
    });
};
const deleteManyBreakdownAssignUser = async (filter) => {
    // Lấy danh sách các BreakdownAssignUser sẽ bị xóa
    const assignUsers = await BreakdownAssignUserModel.find(filter).select('_id');
    const assignUserIds = assignUsers.map((u) => u._id);
    // Xóa các bản ghi checkin/checkout liên quan
    await BreakdownAssignUserCheckinCheckOutModel.deleteMany({ breakdownAssignUser: { $in: assignUserIds } });
    await BreakdownAssignUserRepairModel.deleteMany({ breakdownAssignUser: { $in: assignUserIds } });
    await BreakdownAssignUserAttachmentModel.deleteMany({ breakdownAssignUser: { $in: assignUserIds } });
    // Xóa các BreakdownAssignUser
    return BreakdownAssignUserModel.deleteMany(filter);
};
const createBreakComment = async (category) => {
    return BreakdownCommentModel.create(category);
};

const getBreakCommentByBreakdownId = async (id) => {
    return BreakdownCommentModel.find({ breakdown: id });
};

const deleteManyBreakComment = async (filter) => {
    return BreakdownCommentModel.deleteMany(filter);
};
const updateStatus = async (id, data) => {
    const breakdownAssignUser = await BreakdownAssignUserModel.findById(id);
    if (!breakdownAssignUser) {
        throw new Error('breakdownAssignUser not found');
    }
    Object.assign(breakdownAssignUser, data);
    await breakdownAssignUser.save();
    return breakdownAssignUser;
};

const comfirmBreakdownWWA = async (breakdown, userId, breakdownAssignUserId) => {
    const allAssignUsers = await getBreakdownAssignUsersByBreakdownId(breakdown);
    // các trạng thái không được set
    const excludedStatuses = [
        breakdownAssignUserStatus.rejected,
        breakdownAssignUserStatus.cancelled,
        breakdownAssignUserStatus.completed,
        breakdownAssignUserStatus.replacement,
        // progressStatus.reassignment,
    ];
    const notCompleted = allAssignUsers.filter(
        (user) => user.status !== progressStatus.WCA && !excludedStatuses.includes(user.status)
    );
    if (notCompleted.length === 0) {
        // await breakdownService.updateBreakdownById(breakdown, { status: progressStatus.WWA })
        const data = { code: codeWorkflow.CLOSE_BREAKDOWN, status: false };
        const workflow = await WorkflowModel.findOne(data);
        const history = await breakdownService.getBreakdownHistoryByRes({
            breakdown: breakdownAssignUserId ? breakdownAssignUserId.breakdown : null,
        });
        const _breakdown = await Breakdown.findById(breakdown);
        _breakdown.completedDate = new Date(); // lưu thời gian hoàn thành (kỹ sư)
        await _breakdown.save();
        // cập nhật lại calibration
        if (_breakdown.calibrationWorkAssignUser) {
            // await CalibrationWorkAssignUserModel.findByIdAndUpdate(_breakdown.calibrationWorkAssignUser, {
            //     status: calibrationWorkAssignUserStatus.completeRecalibrationIssue,
            // });
            const calibrationWorkAssignUser = await CalibrationWorkAssignUserModel.findById(
                _breakdown.calibrationWorkAssignUser
            );
            const _calibrationWork = await CalibrationWorkModel.findById(calibrationWorkAssignUser?.calibrationWork);
            if (
                calibrationWorkAssignUser &&
                (calibrationWorkAssignUser.status === calibrationWorkAssignUserStatus.inProgress ||
                    calibrationWorkAssignUser.status === calibrationWorkAssignUserStatus.partiallyCompleted)
            ) {
                calibrationWorkAssignUser.status = calibrationWorkAssignUserStatus.completeRecalibrationIssue;
                calibrationWorkAssignUser.save();
                const payloadNoti = {
                    notificationTypeCode: notificationTypeCode.complete_the_issue_during_calibration,
                    text: `Sự cố ${_breakdown?.code} của hiệu chuẩn ${_calibrationWork.code} hoàn thành. Vui lòng truy cập vào công việc hiệu chuẩn để thực hiện tiếp công việc`,
                    subUrl: `my-calibration-work/detail/${calibrationWorkAssignUser._id}`,
                    webSubUrl: `calibration/calibration-work/view/${calibrationWorkAssignUser.calibrationWork}`,
                    notificationName: 'Hoàn thành vấn đề sự cố khi hiệu chuẩn',
                    user: calibrationWorkAssignUser?.user,
                };
                await notificationService.pushNotificationWithUser(payloadNoti);
            }
            const calibrationWorkService = require('../calibration/calibrationWork.service');
            const history = await calibrationWorkService.getCalibrationWorkTimelineByRes({
                calibrationWork: calibrationWorkAssignUser?.calibrationWork,
            });
            const payloadTimeline = {
                calibrationWork: calibrationWorkAssignUser?.calibrationWork,
                oldStatus: history ? history.status : 'null',
                status: progressStatus.completeRecalibrationIssue,
                workedBy: userId,
                workedDate: Date.now(),
            };
            await calibrationWorkService.createCalibrationWorkTimeline(payloadTimeline);
        }
        if (_breakdown.propertyInspection) {
            const propertyInspection = await PropertyInspectionModel.findById(_breakdown.propertyInspection);
            console.log('propertyInspection', propertyInspection);
            if (propertyInspection.status === propertyInspectionStatus.partiallyCompleted) {
                propertyInspection.status = propertyInspectionStatus.waitingForAdminApproval;
                await propertyInspection.save();
                if (propertyInspection.assetMaintenance) {
                    const assetMaintenance = await AssetMaintenance.findById(propertyInspection.assetMaintenance).populate({
                        path: 'asset',
                    });
                    const assetMaintenanceUsers = await AssetMaintenanceUserModel.find({
                        assetMaintenance: propertyInspection.assetMaintenance,
                    });
                    if (assetMaintenanceUsers && assetMaintenanceUsers.length > 0) {
                        const users = assetMaintenanceUsers.map((item) => item.user);
                        const payloadNoti = {
                            notificationTypeCode: notificationTypeCode.property_inspection,
                            text: `Kiểm tra tài sản ${assetMaintenance?.asset?.assetName}, vấn đề sự cố đã được giải quyết. Vui lòng truy cập để theo dõi hoàn thành tiếp công việc kiểm tra`,
                            subUrl: `maintenance/property-inspection/view/${propertyInspection._id}`,
                            webSubUrl: `maintenance/property-inspection/view/${propertyInspection._id}`,
                            notificationName: 'Kiểm tra tài sản',
                            users: users,
                        };
                        await notificationService.pushNotificationWithUsers(payloadNoti);
                    }
                }
            }
        }
        // const assetMaintenanceIsNotActiveHistory = await AssetMaintenanceIsNotActiveHistoryModel.findOne({
        //     assetMaintenance: _breakdown.assetMaintenance,
        //     endDate: null,
        // });
        // if (assetMaintenanceIsNotActiveHistory) {
        //     assetMaintenanceIsNotActiveHistory.time =
        //         _breakdown.downTimeMilis !== 0
        //             ? _breakdown.downTimeMilis
        //             : Date.now() - assetMaintenanceIsNotActiveHistory.startDate;
        //     assetMaintenanceIsNotActiveHistory.endDate = Date.now();
        //     assetMaintenanceIsNotActiveHistory.origin = _breakdown._id;
        //     await assetMaintenanceIsNotActiveHistory.save();
        // } else {
        //     const payload = {
        //         assetMaintenance: _breakdown.assetMaintenance,
        //         startDate: _breakdown.createdAt,
        //         endDate: Date.now(),
        //         time: _breakdown.downTimeMilis || 0,
        //         createdBy: userId,
        //         origin: _breakdown._id,
        //     };
        //     await AssetMaintenanceIsNotActiveHistoryModel.create(payload);
        // }
        const totalTask = await assetMaintenanceService.getConutTaskAssetMaintenance(_breakdown.assetMaintenance);
        if (totalTask <= 1) {
            const now = new Date();
            await AssetMaintenanceIsNotActiveHistoryModel.findOneAndUpdate(
                {
                    assetMaintenance: _breakdown.assetMaintenance,
                    endDate: null,
                },
                [
                    {
                        $set: {
                            endDate: now,
                            time: { $subtract: [now, '$startDate'] },
                            closedSource: _breakdown._id,
                        },
                    },
                ]
            );
        }
        if (_breakdown) {
            await assetMaintenanceService.updateActiveAsset(_breakdown.assetMaintenance, req.user.id, _breakdown._id, workAsset.breakdown);
        }

        // const assetMaintenanceIsNotActiveHistory = await AssetMaintenanceIsNotActiveHistoryModel.findOne({
        //     assetMaintenance: _breakdown.assetMaintenance,
        //     endDate: null,
        // });
        // if (assetMaintenanceIsNotActiveHistory) {
        //     assetMaintenanceIsNotActiveHistory.time =
        //         _breakdown.downTimeMilis !== 0
        //             ? _breakdown.downTimeMilis
        //             : Date.now() - assetMaintenanceIsNotActiveHistory.startDate;
        //     assetMaintenanceIsNotActiveHistory.endDate = Date.now();
        //     assetMaintenanceIsNotActiveHistory.origin = _breakdown._id;
        //     await assetMaintenanceIsNotActiveHistory.save();
        // } else {
        //     const payload = {
        //         assetMaintenance: _breakdown.assetMaintenance,
        //         startDate: _breakdown.createdAt,
        //         endDate: Date.now(),
        //         time: _breakdown.downTimeMilis || 0,
        //         createdBy: userId,
        //         origin: _breakdown._id,
        //     };
        //     await AssetMaintenanceIsNotActiveHistoryModel.create(payload);
        // }
        if (workflow) {
            await breakdownService.updateBreakdownById(breakdown, {
                status: progressStatus.cloesed,
                ticketStatus: ticketBreakdownStatus.cloesed,
                closingDate: Date.now(),
            });
            // await assetMaintenanceIsNotActiveHistoryService.updateAssetMaintenanceIsNotActiveHistoryByBreakdown(breakdown);
            const breakdownAssignUsers = await BreakdownAssignUserModel.find({ breakdown, status: progressStatus.WCA });
            if (breakdownAssignUsers && breakdownAssignUsers.length > 0) {
                for (const breakdownAssignUser of breakdownAssignUsers) {
                    await updateStatus(breakdownAssignUser._id, { status: progressStatus.cloesed });
                }
            }

            if (_breakdown.schedulePreventiveTaskItem) {
                await breakdownService.completedBreakdownSchedulePreventiveTaskItem(_breakdown.schedulePreventiveTaskItem);
            }
            // lưu lịch sử
            const payloadHistory = {
                oldStatus: history ? history.status : 'null',
                status: progressStatus.cloesed,
                workedDate: Date.now(),
                workedBy: userId,
                breakdownAssignUser: breakdownAssignUserId ? breakdownAssignUserId._id : null,
                breakdown,
            };
            await breakdownService.createBreakdownHistory(payloadHistory);
        } else {
            await breakdownService.updateBreakdownById(breakdown, {
                status: progressStatus.WWA,
                ticketStatus: ticketBreakdownStatus.completed,
            });
            const payloadHistory = {
                oldStatus: history ? history.status : 'null',
                status: progressStatus.completed,
                workedDate: Date.now(),
                workedBy: userId,
                breakdownAssignUser: breakdownAssignUserId ? breakdownAssignUserId._id : null,
                breakdown,
            };
            await breakdownService.createBreakdownHistory(payloadHistory);

            // lưu vào bảng phê duyệt nhanh
            const user = await User.findById(userId);
            const assetMaintenance = await AssetMaintenance.findById(_breakdown.assetMaintenance);
            await ApprovalTaskModel.create({
                sourceType: approvedTaskType.close_breakdown,
                sourceId: _breakdown.id || _breakdown._id,
                title: 'Duyệt sự cố',
                description: `Sự cố ${_breakdown.code}`,
                data: {
                    code: _breakdown.code,
                    assetMaintenance: {
                        ...assetMaintenance,
                    },
                    createdBy: {
                        id: userId,
                        fullName: user?.fullName,
                    },
                    responseTime: _breakdown.responseTime,
                    id: _breakdown.id || _breakdown._id,
                    createdAt: _breakdown.createdAt,
                    incidentDeadline: _breakdown.incidentDeadline,
                },
                requestUser: userId,
            });

            const params = new URLSearchParams({ ticketStatus: 'hasOpened' });
            const notificationContent = {
                notificationTypeCode: notificationTypeCode.approve_incident_closure,
                isNotifyTheManager: true,
                text: `Sự cố ${_breakdown.code} đã hoàn thành. Vui lòng, truy cập để phê duyệt sự cố!`,
                subUrl: `view-my-breakdown/${_breakdown._id}?${params.toString()}`,
                subUrl: `breakdown/work-order-breakdown/view/${_breakdown._id}`,
                notificationName: 'Phê duyệt sự cố',
            };
            await notificationService.pushNotification(notificationContent);
        }
    }
};
const getLatestBreakdownAssignUserCheckInCheckOut = async (filter) => {
    return BreakdownAssignUserCheckinCheckOutModel.findOne(filter)
        .populate({
            path: 'breakdown',
        })
        .sort({ logInAt: -1 });
};
const updateBreakdownAssignUserCheckInCheckOut = async (id, data) => {
    const breakdownAssignUserCheckinCheckOut = await BreakdownAssignUserCheckinCheckOutModel.findById(id);
    if (!breakdownAssignUserCheckinCheckOut) {
        throw new Error('breakdownAssignUserCheckinCheckOut not found');
    }
    Object.assign(breakdownAssignUserCheckinCheckOut, data);
    await breakdownAssignUserCheckinCheckOut.save();
    return breakdownAssignUserCheckinCheckOut;
};
const assignUserFromSpareRequest = async (breakdownSpareRequestId, comment, userIds = []) => {
    const spareRequest = await BreakdownSpareRequest.findById(breakdownSpareRequestId);
    if (!spareRequest) {
        throw new Error('Spare Request not found');
    }
    await BreakdownSpareRequest.findOneAndUpdate(
        { _id: breakdownSpareRequestId },
        { requestStatus: breakdownSpareRequestStatus.submitted, comment, assignUserDate: Date.now() }
    );
    await BreakdownSpareRequestDetail.updateMany(
        { requestStatus: breakdownSpareRequestDetailStatus.approved, breakdownSpareRequest: breakdownSpareRequestId },
        { requestStatus: breakdownSpareRequestDetailStatus.submitted }
    );

    // đăng xuất người gửi yêu cầu nếu đang đăng nhập
    const assignUser = await BreakdownAssignUserModel.findOneAndUpdate(
        { breakdown: spareRequest.breakdown, user: spareRequest.createdBy },
        null,
        { sort: { updatedAt: -1 }, new: true }
    );
    if (!assignUser) throw new Error('Không tìm thấy BreakdownAssignUser');
    const latestCheckInCheckOut = await getLatestBreakdownAssignUserCheckInCheckOut({
        breakdownAssignUser: assignUser._id,
    });
    if (!latestCheckInCheckOut) {
        throw new Error('AssetIdInfo not found');
    }
    const payloadUpdate = {
        logOutAt: new Date(),
        checkOutComments: 'gửi yêu cầu sparePart',
    };
    await updateBreakdownAssignUserCheckInCheckOut(latestCheckInCheckOut.id, payloadUpdate);
    // kiểm tra người đc assign đã tham gia vào sự cố hay chưa
    const findCreatedByIdx = userIds.findIndex((u) => u.toString() === spareRequest.createdBy.toString());
    if (findCreatedByIdx > -1) {
        // cập nhập trạng thái của breackdownAssignUser nếu có người thay
        await BreakdownAssignUserModel.findOneAndUpdate(
            { user: spareRequest.createdBy, breakdown: spareRequest.breakdown },
            {
                $set: { status: breakdownAssignUserStatus.submitted },
            }
        );
    } else {
        const assignUserFromCreateBy = await BreakdownAssignUserModel.findOneAndUpdate(
            { user: spareRequest.createdBy, breakdown: spareRequest.breakdown },
            {
                $set: { status: breakdownAssignUserStatus.replacement },
            }
        );
        const lastCheckInCheckOut = await getLatestBreakdownAssignUserCheckInCheckOut({
            breakdownAssignUser: assignUserFromCreateBy._id,
        });
        if (lastCheckInCheckOut && !lastCheckInCheckOut.logOutAt) {
            await updateBreakdownAssignUserCheckInCheckOut(assignUserFromCreateBy._id, { logOutAt: new Date() });
        }
    }
    const breakdownAssignUserStatusReopen = [breakdownAssignUserStatus.replacement, breakdownAssignUserStatus.rejected];
    for (let index = 0; index < userIds.length; index++) {
        const userId = userIds[index];
        await BreakdownSpareRequestAssignUserModel.create({
            breakdownSpareRequest: breakdownSpareRequestId,
            user: userId,
        });
        const existingAssignUser = await BreakdownAssignUserModel.findOne({
            breakdown: spareRequest.breakdown,
            user: userId,
        });
        // nếu chưa tham gia thì tạo mới assign user
        if (!existingAssignUser) {
            await BreakdownAssignUserModel.create({
                breakdown: spareRequest.breakdown,
                user: userId,
                repairContract: assignUser?.repairContract ? assignUser?.repairContract : null,
            });
        } else if (breakdownAssignUserStatusReopen.includes(existingAssignUser.status)) {
            await BreakdownAssignUserModel.updateOne(
                { breakdown: spareRequest.breakdown, user: userId },
                {
                    status: breakdownAssignUserStatus.assigned,
                    repairContract: assignUser?.repairContract ? assignUser?.repairContract : null,
                }
            );
        }
    }
    // cập nhật trạng thái của breakdown về đã đc gửi tới
    await breakdownService.updateBreakdownById(spareRequest.breakdown, { status: breakdownAssignUserStatus.submitted });
    return spareRequest;
};
const getBreakdownAssignUserById = async (id) => {
    return BreakdownAssignUserModel.findById(id).populate([
        {
            path: 'breakdown',
            populate: [
                {
                    path: 'assetMaintenance',
                    populate: [
                        {
                            path: 'assetModel',
                            populate: [
                                {
                                    path: 'asset',
                                },
                            ],
                        },
                    ],
                },
                {
                    path: 'breakdownDefect',
                },
            ],
        },
        {
            path: 'user',
        },
    ]);
};

const getBreakdownAssignUserCheckInCheckOutByRes = async (data) => {
    const breakdownUserCheckInCheckOut = await BreakdownAssignUserCheckinCheckOutModel.find({ data });
    return breakdownUserCheckInCheckOut;
};
const createCheckinCheckout = async (_checkinCheckout) => {
    const breakdownUserCheckInCheckOut = await BreakdownAssignUserCheckinCheckOutModel.create(_checkinCheckout);
    return breakdownUserCheckInCheckOut;
};

const getBreakdownAssignUserId = async (id) => {
    return BreakdownAssignUserModel.findById(id);
};

const getBreakdownAssignUserByRes = async (res) => {
    return BreakdownAssignUserModel.find(res).populate([
        {
            path: 'user',
            populate: { path: 'role' },
        },
        {
            path: 'repairContract',
        },
    ]);
};

const requestForSupport = async (data) => {
    try {
        // await Breakdown.findByIdAndUpdate(data.breakdown, { ticketStatus: ticketBreakdownStatus.inProgress, status: breakdownStatus.inProgress })
        const assignUser = await BreakdownAssignUserModel.findOneAndUpdate(
            { user: data.user, breakdown: data.breakdown },
            { $set: { status: breakdownAssignUserStatus.requestForSupport } },
            { new: true }
        );
        if (!assignUser) throw new Error('Không tìm thấy BreakdownAssignUser');
        await BreakdownAssignUserRepairModel.create({
            breakdownAssignUser: assignUser._id,
            progressStatus: data.progressStatus,
            reAssignDate: new Date(),
            comment: data.comment,
        });

        // checkout
        const latestCheckInCheckOut = await getLatestBreakdownAssignUserCheckInCheckOut({
            breakdownAssignUser: assignUser._id,
        });

        const payloadUpdate = {
            logOutAt: new Date(),
            checkOutComments: 'gửi requestForSupport',
        };
        await updateBreakdownAssignUserCheckInCheckOut(latestCheckInCheckOut.id, payloadUpdate);

        if (!latestCheckInCheckOut) {
            throw new Error('AssetIdInfo not found');
        }
        return assignUser;
    } catch (error) {
        throw new Error(`Error in requestForSupport: ${error.message}`);
    }
};
const getBreakdownAssignUsersByBreakdownAndNotAssigned = async (id) => {
    return BreakdownAssignUserModel.find({
        breakdown: id,
        status: {
            $in: [breakdownAssignUserStatus.WCA],
        },
    }).populate({
        path: 'user',
    });
};

const checkoutBreakdown = async (breakdownAssignUserId, checkOutComments) => {
    const lastCheckInCheckOut = await getLatestBreakdownAssignUserCheckInCheckOut({
        breakdownAssignUser: breakdownAssignUserId,
    });
    if (!lastCheckInCheckOut || lastCheckInCheckOut.logOutAt) {
        throw new Error('Chưa check in');
    }
    const payloadUpdate = {
        logOutAt: Date.now(),
        // eslint-disable-next-line object-shorthand
        checkOutComments: checkOutComments,
    };
    const breakdownAssignUser = await BreakdownAssignUserModel.findById(breakdownAssignUserId);
    if (breakdownAssignUser) {
        const historyFilter = {
            status: progressStatus.inProgress,
            breakdown: breakdownAssignUser.breakdown,
            logoutDate: null,
            loginDate: { $ne: null },
        };
        const historyUpdate = {
            logoutDate: Date.now(),
            comment: checkOutComments,
        };
        await breakdownService.updateBreakdownHistory(historyFilter, historyUpdate);
    }
    await updateBreakdownAssignUserCheckInCheckOut(lastCheckInCheckOut.id, payloadUpdate);
};
const updateLogOutBreakdownAssignUser = async (breakdownAssignUserId) => {
    const _breakdownAssignUser = await BreakdownAssignUserModel.findById(breakdownAssignUserId);
    if (!_breakdownAssignUser) {
        throw new Error('Chưa check in');
    }
    const lastCheckInCheckOut = await getLatestBreakdownAssignUserCheckInCheckOut({
        breakdownAssignUser: _breakdownAssignUser._id,
    });
    if (lastCheckInCheckOut && !lastCheckInCheckOut.logOutAt) {
        const payloadUpdate = {
            logOutAt: new Date(),
            // eslint-disable-next-line object-shorthand
            checkOutComments: 'Phân công lại',
        };
        await updateBreakdownAssignUserCheckInCheckOut(lastCheckInCheckOut.id, payloadUpdate);
        const historyFilter = {
            breakdown: _breakdownAssignUser.breakdown,
            workedBy: _breakdownAssignUser.user,
            logoutDate: null,
            loginDate: { $ne: null },
        };
        const historyUpdate = {
            logoutDate: Date.now(),
            comment: 'Phân công lại',
        };
        await breakdownService.updateBreakdownHistory(historyFilter, historyUpdate);
    }
    //
    await _breakdownAssignUser.save({ status: breakdownAssignUserStatus.replacement });
    const history = await breakdownService.getBreakdownHistoryByRes({
        workedBy: _breakdownAssignUser.user,
        breakdown: _breakdownAssignUser.breakdown,
    });
    const payloadHistory = {
        oldStatus: history ? history.status : 'null',
        workedDate: Date.now(),
        workedBy: _breakdownAssignUser.user,
        breakdownAssignUser: _breakdownAssignUser._id,
        status: breakdownAssignUserStatus.replacement,
        replacementUser: _breakdownAssignUser.user,
        breakdown: _breakdownAssignUser.breakdown,
    };
    await breakdownService.createBreakdownHistory(payloadHistory);
};
const changeBreakdownStatus = async (breakdownId) => {
    const breakdown = await Breakdown.findById(breakdownId);
    if (!breakdown) {
        throw new Error('Breakdown not found');
    }

    let nextStatus;

    switch (breakdown.status) {
        case breakdownStatus.rejected:
            nextStatus = breakdownStatus.assigned;
            break;
        default:
            break;
    }

    breakdown.status = nextStatus;
    await breakdown.save();

    return breakdown;
};

const replacementAssignUser = async (data) => {
    const breakdownModel = await Breakdown.findById(data.breakdown);
    const breakdownAssignUserReplacement = await BreakdownAssignUserModel.findOne({
        user: data.replacementUser,
        breakdown: data.breakdown,
    });
    if (breakdownAssignUserReplacement && breakdownAssignUserReplacement.status === breakdownAssignUserStatus.reassignment) {
        await breakdownService.updateBreakdownById(breakdownAssignUserReplacement.breakdown, {
            status: breakdownAssignUserStatus.inProgress,
        });
    }
    const lastCheckInCheckOut = await getLatestBreakdownAssignUserCheckInCheckOut({
        breakdownAssignUser: breakdownAssignUserReplacement._id,
    });
    if (lastCheckInCheckOut && !lastCheckInCheckOut.logOutAt) {
        const payloadUpdate = {
            logOutAt: new Date(),
            // eslint-disable-next-line object-shorthand
            checkOutComments: 'Phân công lại',
        };
        await updateBreakdownAssignUserCheckInCheckOut(lastCheckInCheckOut.id, payloadUpdate);
        const historyFilter = {
            breakdown: breakdownAssignUserReplacement.breakdown,
            workedBy: breakdownAssignUserReplacement.user,
            logoutDate: null,
            loginDate: { $ne: null },
        };
        const historyUpdate = {
            logoutDate: Date.now(),
            comment: 'Phân công lại',
        };
        await breakdownService.updateBreakdownHistory(historyFilter, historyUpdate);
    }
    //
    const breakdownAssignUser = await BreakdownAssignUserModel.updateOne(
        { user: data.replacementUser, breakdown: data.breakdown },
        { $set: { status: breakdownAssignUserStatus.replacement } }
    );
    const history = await breakdownService.getBreakdownHistoryByRes({
        workedBy: data.replacementUser,
        breakdown: data.breakdown,
    });
    const payloadHistory = {
        oldStatus: history ? history.status : 'null',
        workedDate: Date.now(),
        workedBy: data.replacementBy,
        breakdownAssignUser: breakdownAssignUser._id,
        status: breakdownAssignUserStatus.replacement,
        replacementUser: data.replacementUser,
        breakdown: data.breakdown,
    };
    await breakdownService.createBreakdownHistory(payloadHistory);

    // Xóa các bản ghi không phải completed hoặc experimentalFix
    // await BreakdownAssignUserModel.deleteMany({
    //     breakdown: data.breakdown,
    //     user: { $in: data.user },
    //     status: { $nin: [breakdownAssignUserStatus.completed, breakdownAssignUserStatus.experimentalFix, breakdownAssignUserStatus.WCA, breakdownAssignUserStatus.inProgress] },
    // });
    // check lại nếu
    // Lấy danh sách userId đã có trạng thái completed hoặc experimentalFix
    // const existed = await BreakdownAssignUserModel.find({
    //     breakdown: data.breakdown,
    //     user: { $in: data.user },
    //     status: { $in: [breakdownAssignUserStatus.completed, progressStatus.experimentalFix, progressStatus.WCA, progressStatus.inProgress] },
    // }).select('user');

    // Chỉ thêm mới những userId chưa có trạng thái completed hoặc experimentalFix
    const insertTasks = data.user.map(async (user) => {
        const payloadNoti = {
            notificationTypeCode: notificationTypeCode.assign_user_breakdown,
            text: `Bạn nhận được công việc mới: ${breakdownModel.code}`,
            subUrl: `view-my-breakdown/${breakdownModel._id}`,
            webSubUrl: `breakdown/work-order-breakdown/view/${breakdownModel._id}`,
            notificationName: 'Bạn nhận được công việc mới',
            user: user,
        };
        await notificationService.pushNotificationWithUser(payloadNoti);
        const _breakdownAssignUser = await BreakdownAssignUserModel.findOne({ breakdown: data.breakdown, user });
        if (_breakdownAssignUser) {
            if (_breakdownAssignUser.status === breakdownStatus.inProgress) {
                await updateLogOutBreakdownAssignUser(_breakdownAssignUser._id);
            }
            if (
                [
                    breakdownStatus.inProgress,
                    breakdownStatus.accepted,
                    breakdownStatus.rejected,
                    breakdownStatus.replacement,
                    breakdownStatus.reassignment,
                ].includes(_breakdownAssignUser.status)
            ) {
                await BreakdownAssignUserModel.findOneAndUpdate(
                    { user, breakdown: data.breakdown },
                    { status: breakdownStatus.assigned, repairContract: data?.repairContract ? data?.repairContract : null }
                );
            }

            return null;
        }

        const assignDoc = await BreakdownAssignUserModel.create({
            breakdown: data.breakdown,
            user,
            status: breakdownAssignUserStatus.assigned,
            repairContract: data?.repairContract ? data?.repairContract : null,
        });
        const _history = await breakdownService.getBreakdownHistoryByRes({
            workedBy: data.replacementUser,
            breakdown: data.breakdown,
        });
        const _payloadHistory = {
            oldStatus: _history ? _history.status : 'null',
            workedDate: Date.now(),
            workedBy: user,
            breakdownAssignUser: assignDoc._id,
            status: breakdownAssignUserStatus.assigned,
            indicaltedUserBy: data.replacementBy,
            breakdown: data.breakdown,
            comment: data.comments,
        };
        await breakdownService.createBreakdownHistory(_payloadHistory);

        return assignDoc;
    });
    await Promise.all(insertTasks);
    if (data.breakdown) {
        // const breakdown = await Breakdown.findById(data.breakdown);
        // if (breakdown.status === progressStatus.reopen) {
        //     const breakdwonAssignUsers = await BreakdownAssignUserModel.find({ breakdown: breakdown._id, status: progressStatus.reassignment });
        //     if (breakdwonAssignUsers.length === 0) {
        //         await breakdownService.updateBreakdownById(breakdown._id, { status: breakdownAssignUserStatus.inProgress })
        //     }
        // }
        await comfirmBreakdownWWA(data.breakdown);
    }
    await changeBreakdownStatus(data.breakdown); // hàm này dùng để luôn chuyển các trạng thái
    // nếu user là phân công lại sẽ chuyển trạng thái thẻ
};

const filterBreakdownAssignUsers = async (_filter) => {
    const breakdownAsignUserFilter = {
        breakdown: { $ne: null },
        user: _filter.user,
    };
    if (_filter.statuses) {
        breakdownAsignUserFilter.status = {
            $in: _filter.statuses,
        };
    }
    const breakdownAssignUsers = await BreakdownAssignUserModel.find(breakdownAsignUserFilter);
    return breakdownAssignUsers;
};
const queryBreakdownAssignUsers = async (_filter, options) => {
    const breakdownAsignUserFilter = {};
    if (_filter.statuses) {
        breakdownAsignUserFilter.status = {
            $in: _filter.statuses,
        };
    }
    const breakdownAssignUsers = await BreakdownAssignUserModel.paginate(breakdownAsignUserFilter, {
        ...options,
        // populate: {
        //     path: 'breakdown'
        // }
    });
    return breakdownAssignUsers;
};
const getTotalMyBreakdownAssignUserStatus = async (user) => {
    const statusNews = [
        breakdownAssignUserStatus.assigned,
        breakdownAssignUserStatus.rejected,
        breakdownAssignUserStatus.accepted,
    ];
    const totalMyBreakdownAssignUserStatusNews = await BreakdownAssignUserModel.countDocuments({
        status: { $in: statusNews },
        user,
    });

    const statusInProgress = [
        breakdownAssignUserStatus.inProgress,
        breakdownAssignUserStatus.requestForSupport,
        breakdownAssignUserStatus.WCA,
        breakdownAssignUserStatus.reassignment,
        breakdownAssignUserStatus.experimentalFix,
        breakdownAssignUserStatus.pending_approval,
        breakdownAssignUserStatus.approved,
        breakdownAssignUserStatus.submitted,
    ];
    const totalMyBreakdownAssignUserStatusInProgress = await BreakdownAssignUserModel.countDocuments({
        status: { $in: statusInProgress },
        user,
    });

    const statusOverdues = [
        breakdownAssignUserStatus.assigned,
        breakdownAssignUserStatus.rejected,
        breakdownAssignUserStatus.accepted,
        breakdownAssignUserStatus.inProgress,
        breakdownAssignUserStatus.requestForSupport,
        breakdownAssignUserStatus.WCA,
        breakdownAssignUserStatus.reassignment,
        breakdownAssignUserStatus.experimentalFix,
        breakdownAssignUserStatus.pending_approval,
        breakdownAssignUserStatus.approved,
        breakdownAssignUserStatus.submitted,
    ];
    const totalMyBreakdownAssignUserStatusOverdues = await BreakdownAssignUserModel.countDocuments({
        status: { $in: statusOverdues },
        user,
        incidentDeadline: { $lt: new Date() },
    });

    return {
        totalMyBreakdownAssignUserStatusNews,
        totalMyBreakdownAssignUserStatusInProgress,
        totalMyBreakdownAssignUserStatusOverdues,
    };
};

const getBreackDownAssignUserByStatus = async () => {
    const res = await BreakdownAssignUserModel.find({ status: 'experimentalFix' }).populate({ path: 'breakdown' });
    return res;
};
const getTotalBreakdownAssignUserByUserId = async (userId) => {
    return BreakdownAssignUserModel.countDocuments({
        user: userId,
        status: {
            $in: [
                breakdownAssignUserStatus.assigned,
                breakdownAssignUserStatus.rejected,
                breakdownAssignUserStatus.inProgress,
                breakdownAssignUserStatus.reopen,
                breakdownAssignUserStatus.accepted,
                breakdownAssignUserStatus.accepted,
                breakdownAssignUserStatus.approved,
                breakdownAssignUserStatus.requestForSupport,
                breakdownAssignUserStatus.pendingApproval,
                breakdownAssignUserStatus.WCA,
                breakdownAssignUserStatus.submitted,
                breakdownAssignUserStatus.experimentalFix,
            ],
        },
    });
};
const getTotalEngineerBreakdownAssignUser = async (breakdownUserAssignId) => {
    const beakdownAssignUser = await BreakdownAssignUserModel.findById(breakdownUserAssignId);
    if (!beakdownAssignUser) {
        throw new Error('beakdownAssignUser not found');
    }
    const breakdown = await Breakdown.findById(beakdownAssignUser.breakdown);
    if (!beakdownAssignUser) {
        throw new Error('breakdown not found');
    }
    // thêm experimentalFix
    const excludedStatuses = [
        breakdownAssignUserStatus.rejected,
        breakdownAssignUserStatus.cancelled,
        breakdownAssignUserStatus.completed,
        breakdownAssignUserStatus.replacement,
        breakdownAssignUserStatus.WCA,
        breakdownAssignUserStatus.experimentalFix,
    ];
    const allAssignUsers = await BreakdownAssignUserModel.countDocuments({
        breakdown: beakdownAssignUser.breakdown,
        status: { $nin: excludedStatuses },
    });
    let time = 0;
    if (breakdown.assetMaintenanceStatus == assetMaintenanceStatus.isActive) {
        time = 0;
    } else {
        const assetMaintenanceIsNotActiveHistory = await AssetMaintenanceIsNotActiveHistoryModel.findOne({
            assetMaintenance: breakdown.assetMaintenance,
            endDate: null,
        });
        if (assetMaintenanceIsNotActiveHistory) {
            time = Date.now() - assetMaintenanceIsNotActiveHistory.startDate;
        }
    }

    return { allAssignUsers, time };
};
module.exports = {
    createBreakdownAssignUser,
    createBreakComment,
    getBreakdownAssignUserByBreakdownId,
    deleteManyBreakdownAssignUser,
    getBreakCommentByBreakdownId, // export mới
    deleteManyBreakComment,
    updateStatus,
    replacementAssignUser,
    getBreakdownAssignUserById,
    getBreakdownAssignUserCheckInCheckOutByRes,
    getBreakdownAssignUsersByBreakdownId,
    getCheckInCheckOutsByBreakdownIdUserId,
    getLatestBreakdownAssignUserCheckInCheckOut,
    createCheckinCheckout,
    updateBreakdownAssignUserCheckInCheckOut,
    requestForSupport,
    getBreakdownAssignUserId,
    getBreakdownAssignUserByRes,
    comfirmBreakdownWWA,
    getBreakdownAssignUsersByBreakdownAndNotAssigned,
    checkoutBreakdown,
    queryBreakdownAssignUsers,
    filterBreakdownAssignUsers,
    assignUserFromSpareRequest,
    getTotalMyBreakdownAssignUserStatus,
    getBreackDownAssignUserByStatus,
    getTotalBreakdownAssignUserByUserId,
    getTotalEngineerBreakdownAssignUser,
};
