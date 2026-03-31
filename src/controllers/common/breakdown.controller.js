const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const catchAsync = require('../../utils/catchAsync');
const {
    breakdownService,
    sequenceService,
    breakdownAssignUserService,
    resourceService,
    breakdownAssignUserRepairService,
    assetMaintenanceService,
    assetMaintenanceIsNotActiveHistoryService,
    schedulePreventiveService,
    approvalTaskService,
    assetMaintenanceSolutionBankService,
    assetModelSolutionService,
} = require('../../services');
const ApiError = require('../../utils/ApiError');
const { BreakdownAssignUserModel, Breakdown, BreakdownAssignUserRepairModel, AssetMaintenance } = require('../../models');
const {
    ticketBreakdownStatus,
    breakdownAssignUserStatus,
    progressStatus,
    breakdownStatus,
    assetMaintenanceStatus,
    notificationTypeCode,
    assetStatus,
    workAsset,
} = require('../../utils/constant');
const notificationService = require('../../services/notification/notification.service');
const config = require('../../config/config');
/**
 * Create a user
 * @type {(function(*, *, *): void)|*}
 */

const createBreakdown = catchAsync(async (req, res) => {
    req.body = {
        ...req.body,
        createdBy: req?.user?.id,
        // updatedBy: req.user.id,
        code: await sequenceService.generateSequenceCode('BREAKDOWN_TIKET'),
    };
    const assetMaintenance = await assetMaintenanceService.getAssetMaintenanceByIdNotPopulate(req.body.assetMaintenance);
    if (assetMaintenance) {
        req.body.customer = assetMaintenance.customer;
    }
    const breakdown = await breakdownService.createBreakdown(req.body);
    // tạo bản ghi lịch sử khi đổi trạng thái của assetMaintenance thành isNotActive
    // const assetMaintenanceIsNotActiveHistory =
    //     await assetMaintenanceIsNotActiveHistoryService.assetMaintenanceIsNotActiveHistoryByAssetMaintenance(
    //         assetMaintenance._id
    //     );
    // if (
    //     req.body.assetMaintenanceStatus == assetMaintenanceStatus.isNotActive &&
    //     assetMaintenanceIsNotActiveHistory.length == 0
    // ) {
    //     await assetMaintenanceIsNotActiveHistoryService.createAssetMaintenanceIsNotActiveHistory({
    //         assetMaintenance: req.body.assetMaintenance,
    //         startDate: Date.now(),
    //         createdBy: req?.user?.id,
    //         origin: breakdown?._id,
    //     });
    // }
    const { listResource } = req.body;
    if (listResource && listResource.length > 0) {
        // eslint-disable-next-line no-plusplus
        for (let i = 0; i < listResource.length; i++) {
            // eslint-disable-next-line no-await-in-loop
            await breakdownService.createBreakdownAttachment({
                breakdown: breakdown._id,
                resource: listResource[i].resource,
            });
        }
    }
    const payloadHistory = {
        workedDate: Date.now(),
        status: progressStatus.raised,
        workedBy: req.user?.id,
        breakdown: breakdown?._id,
    };
    await breakdownService.createBreakdownHistory(payloadHistory);
    const params = new URLSearchParams({ ticketStatus: 'hasOpened' });
    const notificationContent = {
        notificationTypeCode: notificationTypeCode.create_breakdown,
        isNotifyTheManager: true, // nếu bằng tru thì cần phải nhập người quản lý để thông báo
        text: `Bạn nhận được công việc mới: ${breakdown.code}`,
        subUrl: `view-my-breakdown/${breakdown._id}?${params.toString()}`,
        webSubUrl: `breakdown/work-order-breakdown/view/${breakdown._id}`,
    };
    await notificationService.pushNotification(notificationContent);
    res.status(httpStatus.CREATED).send({ code: 1, breakdown });
});
const createBreakdownAll = async (user) => {
    const now = new Date();
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(now.getDate() - 1);
    const assetMaintenances = await AssetMaintenance.find({
        createdAt: {
            $gte: twoDaysAgo,
            $lte: now,
        },
    });

    for (const a of assetMaintenances) {
        const payload = {
            createdBy: user,
            // updatedBy: req.user.id,
            code: await sequenceService.generateSequenceCode('BREAKDOWN_TIKET'),
            assetMaintenance: a._id,
        };
        const assetMaintenance = await assetMaintenanceService.getAssetMaintenanceByIdNotPopulate(a._id);
        if (assetMaintenance) {
            payload.customer = assetMaintenance.customer;
        }
        payload.priorityLevel = 'immediate';
        await breakdownService.createBreakdown(payload);
        // await Breakdown.findOneAndDelete({ assetMaintenance: a._id })
    }

    return assetMaintenances;
};
const createBreakdownNoAuth = catchAsync(async (req, res) => {
    req.body = {
        ...req.body,
        code: await sequenceService.generateSequenceCode('BREAKDOWN_TIKET'),
    };
    const assetMaintenance = await assetMaintenanceService.getAssetMaintenanceByIdNotPopulate(req.body.assetMaintenance);
    if (assetMaintenance) {
        req.body.customer = assetMaintenance.customer;
    }
    const breakdown = await breakdownService.createBreakdown(req.body);
    const assetMaintenanceIsNotActiveHistory =
        await assetMaintenanceIsNotActiveHistoryService.assetMaintenanceIsNotActiveHistoryByAssetMaintenance(
            assetMaintenance._id
        );
    // tạo bản ghi lịch sử khi đổi trạng thái của assetMaintenance thành isNotActive
    const { listResource } = req.body;
    if (listResource && listResource.length > 0) {
        // eslint-disable-next-line no-plusplus
        for (let i = 0; i < listResource.length; i++) {
            // eslint-disable-next-line no-await-in-loop
            await breakdownService.createBreakdownAttachment({
                breakdown: breakdown._id,
                resource: listResource[i].resource,
            });
        }
    }
    const payloadHistory = {
        workedDate: Date.now(),
        status: progressStatus.raised,
        // workedBy: req.user.id,
        breakdown: breakdown._id,
    };
    await breakdownService.createBreakdownHistory(payloadHistory);
    // tạo thông báo
    const params = new URLSearchParams({ ticketStatus: 'hasOpened' });
    const notificationContent = {
        notificationTypeCode: notificationTypeCode.create_breakdown,
        isNotifyTheManager: true, // nếu bằng tru thì cần phải nhập người quản lý để thông báo
        text: `Bạn nhận được công việc mới: ${breakdown.code}`,
        subUrl: `view-my-breakdown/${breakdown._id}?${params.toString()}`,
        webSubUrl: `breakdown/work-order-breakdown/view/${breakdown._id}`,
    };
    await notificationService.pushNotification(notificationContent);

    res.status(httpStatus.CREATED).send({ code: 1, breakdown });
});
const getBreakdownByUser = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['serial', 'breakdownDefect', 'ticketStatus', 'user']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await breakdownService.queryBreakdowns(filter, options);
    // Populate breakdownAssignUser cho từng breakdown
    const breakdownsWithAssignUsers = await Promise.all(
        result.results.map(async (breakdown) => {
            const assignUsers = await BreakdownAssignUserModel.find({
                breakdown: breakdown._id,
                user: req.query.user, // Sửa ở đây
            }).populate('user');
            return {
                ...breakdown.toObject(),
                id: breakdown._id,
                breakdownAssignUsers: assignUsers.map((u) => ({
                    ...u.toObject(),
                    id: u._id,
                })),
            };
        })
    );
    res.send({ ...result, results: breakdownsWithAssignUsers, code: 1 });
});
const getBreakdowns = catchAsync(async (req, res) => {
    // createBreakdownAll(req.user.id)
    const filter = pick(req.body, [
        'serial',
        'assetMaintenance',
        'assetStatus',
        'breakdownDefect',
        'isOverdue',
        'ticketStatus',
        'code',
        'priorityLevel',
        'status',
        'ticketStatuses',
        'assetStyle',
        'assetModelName',
        'assetName',
        'breakdownStatus',
        'groupUser',
        'searchText',
        'breakdownStatuses',
    ]);
    const assetMaintenanceFilter = pick(req.body, [
        'branchs',
        'assetStyles',
        'customers',
        'serviceCategorys',
        'subServiceCategorys',
        'assets',
        'manufacturers',
        'categorys',
        'priorityLevels',
        'assetMaintenances',
        'assetModels',
        'startDate',
        'endDate',
    ]);
    const breakdownAssignUserFilter = pick(req.body, ['user', 'breakdownAssignUserStatuses']);
    const options = pick(req.body, ['sortBy', 'sortOrder', 'limit', 'page']);
    if (breakdownAssignUserFilter.breakdownAssignUserStatuses) {
        const userIds = await schedulePreventiveService.getUserIdsByDepartment(req.user.id);
        const breakdownAssignUsers = await breakdownAssignUserService.filterBreakdownAssignUsers({
            statuses: breakdownAssignUserFilter.breakdownAssignUserStatuses,
            user: filter.groupUser ? { $in: userIds } : breakdownAssignUserFilter.user,
        });
        filter.breakdownIds = breakdownAssignUsers.map((item) => item.breakdown);
        delete filter.groupUser;
    }

    const { breakdowns, totalResults } = await breakdownService.queryBreakdowns(
        filter,
        options,
        assetMaintenanceFilter,
        req
    );
    // Populate breakdownAssignUser cho từng breakdown
    const breakdownsWithAssignUsers = await Promise.all(
        breakdowns.map(async (breakdown) => {
            const assignUsers = await breakdownAssignUserService.getBreakdownAssignUserByRes({ breakdown: breakdown._id });
            const breakdownDetail = await breakdownService.getBreakdownById(breakdown._id);

            return {
                ...breakdown,
                id: breakdown._id,
                ...breakdownDetail.toObject(),
                workingTime: await breakdownService.workingTimeBreakdown(breakdown), // Thêm trường workingTime của breakdown
                breakdownAssignUsers: assignUsers.map((u) => ({
                    ...u.toObject(),
                    id: u._id,
                })),
            };
        })
    );
    res.send({ results: breakdownsWithAssignUsers, ...totalResults, code: 1 });
});

const getBreakdownById = catchAsync(async (req, res) => {
    const breakdown = await breakdownService.getBreakdownById(req.query.id);
    const breakdownAttachments = await breakdownService.getBreakdownAttachmentByBreakdownId(req.query.id);
    // Lấy danh sách breakdownAssignUser
    const breakdownAssignUsers = await breakdownAssignUserService.getBreakdownAssignUserByRes({
        breakdown: req.query.id,
    });
    const breakdownHistorys = await breakdownService.getAllBreakdownHistory({ breakdown: req.query.id });
    res.send({ breakdown, breakdownAttachments, breakdownAssignUsers, breakdownHistorys, code: 1 });
});

/**
 * Update user by id.
 * @type {(function(*, *, *): void)|*}
 */
const updateBreakdown = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body.data;
    const data = { ...updateData, updatedAt: Date.now() };
    updateData.updatedBy = req.user?.id; // Nếu cần
    const updated = await breakdownService.updateBreakdownById(id, data);
    res.send({ code: 1, data: updated });
});

/**
 * Delete user by id.
 * @type {(function(*, *, *): void)|*}
 */
const deleteBreakdown = catchAsync(async (req, res) => {
    // Xóa breakdownAttachment và resource liên quan
    const attachments = await breakdownService.getBreakdownAttachmentByBreakdownId(req.query.id);
    if (attachments && attachments.length > 0) {
        // eslint-disable-next-line no-restricted-syntax
        for (const att of attachments) {
            // Xóa resource liên quan
            if (att.resource) {
                // eslint-disable-next-line no-await-in-loop
                await resourceService.deleteResourceById(att.resource);
            }
            // Xóa breakdownAttachment
            // eslint-disable-next-line no-await-in-loop
            await breakdownService.deleteBreakdownAttachmentByIdBreakdown(att._id);
        }
    }
    const breakdownDoc = await breakdownService.deleteBreakdownById(req.query.id);

    // update
    await assetMaintenanceService.updateActiveAsset(breakdownDoc.assetMaintenance, req.user.id, req.query.id, workAsset.breakdown);

    res.status(httpStatus.OK).send({ code: 1 });
});

const updateStatus = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body.data;
    const updated = await breakdownService.updateStatus(id, updateData);
    res.send({ code: 1, data: updated });
});

const getAllBreakdown = catchAsync(async (req, res) => {
    const breakdowns = await breakdownService.getAllBreakdown();
    res.send({ code: 1, data: breakdowns });
});

const getSubBreakdown = catchAsync(async (req, res) => {
    const breakdownDefects = await breakdownService.getAllBreakdownDefect();
    res.send({ code: 1, data: { breakdownDefects } });
});

const getBreakdownComments = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['comments', 'breakdown']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await breakdownService.getBreakdownComments(filter, options);
    res.send({ code: 1, result });
});

const createBreakdownComment = catchAsync(async (req, res) => {
    req.body = {
        ...req.body,
        createdBy: req.user?.id,
    };
    const breakdown = await breakdownService.createBreakdownComment(req.body);
    res.status(httpStatus.CREATED).send({ code: 1, breakdown });
});

const comfirmCloseBreakdown = catchAsync(async (req, res) => {
    const { breakdown, comment, repairs, listAttachment, closeSignature, saveSolutionBank } = req.body;
    // Cập nhật trạng thái breakdown thành "closed"

    if (comment) {
        await breakdownAssignUserService.createBreakComment({ breakdown, createdBy: req.user?.id, comments: comment });
    }
    if (repairs && Array.isArray(repairs) && repairs.length > 0) {
        // eslint-disable-next-line no-restricted-syntax
        for (const repair of repairs) {
            // eslint-disable-next-line no-await-in-loop
            await breakdownAssignUserRepairService.updateStatus(repair.id, repair);
            if (saveSolutionBank?.[repair.id]) {
                await assetModelSolutionService.createAssetModelSolutionByBreakdown(repair, breakdown);
            }
        }
    }
    if (listAttachment) {
        await breakdownService.createinsertManyBreakdownAttachmentClose(listAttachment);
    }
    const updateBreakdown = await breakdownService.updateBreakdownById(breakdown, {
        ticketStatus: ticketBreakdownStatus.cloesed,
        status: progressStatus.cloesed,
        closingDate: Date.now(),
        closeSignature,
    });
    // eslint-disable-next-line object-shorthand
    const breakdownAssignUsers = await breakdownAssignUserService.getBreakdownAssignUserByRes({
        breakdown,
        status: progressStatus.WCA,
    });
    if (breakdownAssignUsers && breakdownAssignUsers.length > 0) {
        for (const breakdownAssignUser of breakdownAssignUsers) {
            await breakdownAssignUserService.updateStatus(breakdownAssignUser._id, { status: progressStatus.cloesed });
        }
    }
    const history = await breakdownService.getBreakdownHistoryByRes({ breakdown });
    const payloadHistory = {
        oldStatus: history ? history.status : 'null',
        status: progressStatus.cloesed,
        workedDate: Date.now(),
        workedBy: req.user?.id,
        // eslint-disable-next-line object-shorthand
        comment: comment,
        // eslint-disable-next-line object-shorthand
        breakdown: breakdown,
    };
    await breakdownService.createBreakdownHistory(payloadHistory);
    const _breakdown = await Breakdown.findById(breakdown);
    if (_breakdown.schedulePreventiveTaskItem) {
        await breakdownService.completedBreakdownSchedulePreventiveTaskItem(_breakdown.schedulePreventiveTaskItem);
    }

    const isDoneOnTime = new Date() <= _breakdown.incidentDeadline;
    if (breakdownAssignUsers && breakdownAssignUsers.length > 0) {
        for (breakdownAssignUser of breakdownAssignUsers) {
            await breakdownAssignUserService.updateStatus(breakdownAssignUser._id, {
                isCompletedOnTime: isDoneOnTime,
                isOverdue: !isDoneOnTime,
            });
        }
    }

    const payload = {
        processedAt: new Date(),
        processedBy: req.user?.id,
        status: 'PROCESSED',
    };
    await approvalTaskService.updateApprovalTaskBySourceId(breakdown, payload);

    // update trạng thái assetMaintenance về active
    // if (updateBreakdown) {
    //     await assetMaintenanceService.updateActiveAsset(updateBreakdown.assetMaintenance, req.user.id);
    // }

    res.send({ code: 1, message: 'Breakdown closed successfully' });
});

const comfirmReopenBreakdown = catchAsync(async (req, res) => {
    const { breakdown, reasonReopen } = req.body.data;
    // Cập nhật trạng thái breakdown thành "reopen"
    await breakdownService.updateBreakdownById(breakdown, {
        status: breakdownStatus.reopen,
        reasonReopen,
        ticketStatus: ticketBreakdownStatus.inProgress,
    });
    // Lấy tất cả assignUser liên quan đến breakdown này
    const assignUsers = await breakdownAssignUserService.getBreakdownAssignUsersByBreakdownAndNotAssigned(breakdown);
    // Đổi trạng thái cho từng assignUser
    if (assignUsers && assignUsers.length > 0) {
        // eslint-disable-next-line no-restricted-syntax
        for (const assignUser of assignUsers) {
            // eslint-disable-next-line no-await-in-loop
            await breakdownAssignUserService.updateStatus(assignUser._id, { status: progressStatus.reassignment });
            // chuyển các bản ghi lưu kết quả sửa thành công trước đó về false
            // eslint-disable-next-line no-await-in-loop
            await BreakdownAssignUserRepairModel.updateMany({ breakdownAssignUser: assignUser._id }, { status: false });
        }
    }
    // khi mở lại sự cố thì check và tạo lại 1 bản ghi lịch sử downtime
    const getBreakdown = await breakdownService.getBreakdownByIdNoPopulate(breakdown);
    await assetMaintenanceIsNotActiveHistoryService.rollbackeAssetMaintenanceIsNotActiveHistory(
        getBreakdown.assetMaintenance,
        getBreakdown._id
    );
    const history = await breakdownService.getBreakdownHistoryByRes({ breakdown });
    const payloadHistory = {
        oldStatus: history ? history.status : 'null',
        status: breakdownStatus.reopen,
        workedDate: Date.now(),
        workedBy: req.user?.id,
        comment: reasonReopen,
        // eslint-disable-next-line object-shorthand
        breakdown: breakdown,
    };
    await breakdownService.createBreakdownHistory(payloadHistory);

    const payload = {
        processedAt: new Date(),
        processedBy: req.user?.id,
        status: 'PROCESSED',
    };
    await approvalTaskService.updateApprovalTaskBySourceId(breakdown, payload);
    res.send({ code: 1, message: 'Breakdown reopened successfully' });
});
const comfirmCancelBreakdown = catchAsync(async (req, res) => {
    const { breakdown, reasonCancel } = req.body.data;
    // Cập nhật trạng thái breakdown thành "cancel"
    // eslint-disable-next-line object-shorthand
    const breakdownDoc = await breakdownService.cancelBreakdown(breakdown, reasonCancel, req);
    const history = await breakdownService.getBreakdownHistoryByRes({ breakdown });
    const payloadHistory = {
        oldStatus: history ? history.status : 'null',
        status: breakdownAssignUserStatus.cancelled,
        workedDate: Date.now(),
        workedBy: req.user.id,
        // eslint-disable-next-line object-shorthand
        breakdown: breakdown,
    };
    await breakdownService.createBreakdownHistory(payloadHistory);

    await assetMaintenanceService.updateActiveAsset(breakdownDoc.assetMaintenance._id, req.user.id, breakdown, workAsset.breakdown);

    res.send({ code: 1, message: 'Breakdown canceled successfully' });
});
const getAllBreakdownAttachment = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['breakdown']);
    const data = await breakdownService.getAllBreakdownAttachment(filter);
    res.send({ code: 1, data });
});

const getAllAttachmentByBreackdown = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['breakdown']);

    const breakdownAttachment = await breakdownService.getAllBreakdownAttachment(filter);

    const breakdownAsignUsserAttachment = await breakdownService.getAllAttachmentByBreackdown(filter);

    const breakdownAttachmentClose = await breakdownService.getBreakdownAttachmentCloseModelByBreakdown(filter);
    const attachments = [
        ...breakdownAttachment.map((item) => ({
            ...item._doc,
            attachmentCategory: 'INCIDENT', // tệp đính kèm sự cố
        })),
        ...breakdownAsignUsserAttachment.map((item) => ({
            ...item._doc,
            attachmentCategory: 'REPAIR', // tệp kết quả sửa chữa
        })),
        ...breakdownAttachmentClose.map((item) => ({
            ...item._doc,
            attachmentCategory: 'CLOSE', // tệp đóng sự cố
        })),
    ];

    res.send({
        code: 1,
        data: attachments,
    });
});
const createBreakdownAttachment = catchAsync(async (req, res) => {
    req.body = {
        ...req.body,
    };
    const breakdown = await breakdownService.createBreakdownAttachment(req.body);
    res.status(httpStatus.CREATED).send({ code: 1, breakdown });
});

const getAllSearchMyBreakdown = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['code']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    // filter.user = req.user.id;
    const result = await breakdownService.getAllSearchMyBreakdown(filter, options);

    const breakdownsWithAssignUsers = await Promise.all(
        result.results.map(async (breakdown) => {
            const assignUsers = await BreakdownAssignUserModel.find({ breakdown: breakdown._id }).populate('user');
            // Tính thời gian làm việc (milliseconds)
            let workingTime = null;
            if (breakdown.closingDate && breakdown.createdAt) {
                workingTime = ((new Date(breakdown.closingDate) - new Date(breakdown.createdAt)) / (1000 * 60 * 60)).toFixed(
                    2
                ); // hours
            }
            return {
                ...breakdown.toObject(),
                id: breakdown._id,
                workingTime, // Thêm trường workingTime của breakdown
                breakdownAssignUsers: assignUsers.map((u) => ({
                    ...u.toObject(),
                    id: u._id,
                })),
            };
        })
    );

    res.send({ code: 1, data: { ...result, results: breakdownsWithAssignUsers } });
});
const getTotalBreakdwonStatus = catchAsync(async (req, res) => {
    const filter = pick(req.body, ['branchs']);
    const totalBreakdownStatuses = await breakdownService.getTotalBreakdwonStatus(filter, req);
    res.send({ code: 1, data: totalBreakdownStatuses });
});
const getGroupBreakdownByUsers = catchAsync(async (req, res) => {
    const filter = pick(req.body, [
        'serial',
        'assetMaintenance',
        'assetStatus',
        'breakdownDefect',
        'isOverdue',
        'ticketStatus',
        'code',
        'priorityLevel',
        'status',
        'ticketStatuses',
        'assetStyle',
        'assetModelName',
        'assetModelName',
        'assetName',
        'breakdownStatus',
    ]);
    const assetMaintenanceFilter = pick(req.body, [
        'branchs',
        'assetStyles',
        'customers',
        'serviceCategorys',
        'subServiceCategorys',
        'assets',
        'manufacturers',
        'categorys',
        'priorityLevels',
        'assetMaintenances',
        'assetModels',
        'startDate',
        'endDate',
    ]);
    const breakdownAssignUserFilter = pick(req.body, ['user', 'breakdownAssignUserStatuses']);
    const options = pick(req.body, ['sortBy', 'sortOrder', 'limit', 'page']);
    if (breakdownAssignUserFilter.breakdownAssignUserStatuses) {
        const breakdownAssignUsers = await breakdownAssignUserService.filterBreakdownAssignUsers({
            statuses: breakdownAssignUserFilter.breakdownAssignUserStatuses,
            user: breakdownAssignUserFilter.user,
        });
        filter.breakdownIds = breakdownAssignUsers.map((item) => {
            return item.breakdown;
        });
    }
    const { breakdowns, totalResults } = await breakdownService.getGroupBreakdownByUsers(
        filter,
        options,
        assetMaintenanceFilter
    );
    // Populate breakdownAssignUser cho từng breakdown
    const breakdownsWithAssignUsers = await Promise.all(
        breakdowns.map(async (breakdown) => {
            const assignUsers = await breakdownAssignUserService.getBreakdownAssignUserByRes({ breakdown: breakdown._id });
            const breakdownDetail = await breakdownService.getBreakdownById(breakdown._id);

            return {
                ...breakdown,
                id: breakdown._id,
                ...breakdownDetail.toObject(),
                workingTime: await breakdownService.workingTimeBreakdown(breakdown), // Thêm trường workingTime của breakdown
                breakdownAssignUsers: assignUsers.map((u) => ({
                    ...u.toObject(),
                    id: u._id,
                })),
            };
        })
    );
    res.send({ results: breakdownsWithAssignUsers, ...totalResults });
});
const getAssetIncidentHistorys = catchAsync(async (req, res) => {
    const filter = pick(req.body, [
        'assetMaintenance',
        'statuses',
        'code',
        'priorityLevel',
        'assetStyle',
        'startDate',
        'endDate',
    ]);
    const options = pick(req.body, ['sortBy', 'sortOrder', 'limit', 'page']);
    const breakdowns = await breakdownService.getAssetIncidentHistorys(filter, options);
    res.send({ breakdowns, code: 1 });
});
module.exports = {
    createBreakdown,
    getBreakdowns,
    getBreakdownById,
    updateBreakdown,
    deleteBreakdown,
    updateStatus,
    getAllBreakdown,
    getSubBreakdown,
    getBreakdownComments,
    createBreakdownComment,
    getBreakdownByUser,
    comfirmCloseBreakdown,
    comfirmReopenBreakdown,
    comfirmCancelBreakdown,
    getAllBreakdownAttachment,
    createBreakdownAttachment,
    getAllSearchMyBreakdown,
    getTotalBreakdwonStatus,
    createBreakdownNoAuth,
    getGroupBreakdownByUsers,
    getAssetIncidentHistorys,
    getAllAttachmentByBreackdown,
};
