const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const catchAsync = require('../../utils/catchAsync');
const {
    schedulePreventiveService,
    preventiveService,
    sequenceService,
    schedulePrevetiveTaskSparePartRequestService,
    approvalTaskService,
    assetMaintenanceService,
    userService,
    inventoryService,
    stockIssueService,
} = require('../../services');
const ApiError = require('../../utils/ApiError');
const {
    spareRequestType,
    schedulePreventiveTaskRequestSparePartDetailStatus,
    notificationTypeCode,
} = require('../../utils/constant');
const { SparePartDetail } = require('../../models');
const notificationService = require('../../services/notification/notification.service');
/**
 * Create a user
 * @type {(function(*, *, *): void)|*}
 */
const createSchedulePreventiveSparePartRequest = catchAsync(async (req, res) => {
    const { schedulePreventive, schedulePreventiveTask, schedulePreventiveRequestSpareParts, assetMaintenance } =
        req.body.data;
    const payload = {
        schedulePreventive,
        schedulePreventiveTask,
        createdBy: req.user.id,
        userName: req.user.fullName,
        code: await sequenceService.generateSequenceCode('SPARE_PART_REQUEST'),
    };
    const countSchedulePreventiveTaskRequestSparePart =
        await schedulePrevetiveTaskSparePartRequestService.countSchedulePreventiveTaskRequestSparePartBySchedulePreventiveTaskId(
            schedulePreventiveTask
        );
    // nếu mà có rồi thì sẽ không thêm mới nữa chỉ thêm mới các detail
    const schedulePrevetiveSparePartRequest =
        countSchedulePreventiveTaskRequestSparePart > 0
            ? await schedulePrevetiveTaskSparePartRequestService.getSchedulePreventiveTaskRequestSparePartLatest(
                schedulePreventiveTask
            )
            : await schedulePrevetiveTaskSparePartRequestService.createschedulePrevetiveSparePartRequest(payload);

    const schedulePreventiveById = await schedulePreventiveService.getSchedulePreventiveByIdNotPopulate(schedulePreventive);
    if (!schedulePreventiveById || !schedulePreventiveById.assetMaintenance) {
        throw new ApiError('Không tìm thấy phiếu bảo trì');
    }

    for (const item of schedulePreventiveRequestSpareParts) {
        const detailPayload = {
            sparePart: item.sparePart,
            schedulePrevetiveTaskSparePartRequest: schedulePrevetiveSparePartRequest._id,
            spareRequestType: item.spareRequestType,
            qty: item.qty,
            unitCost: item.unitCost,
            createdBy: req.user.id,
        };
        if (item.spareRequestType === spareRequestType.spareReplace) {
            detailPayload.requestStatus = schedulePreventiveTaskRequestSparePartDetailStatus.spareReplace;
            // nếu là thay thế phụ tùng thì tạo lịch sử thay thế phụ tùng
            await assetMaintenanceService.createHistoryAssetMaintenanceSparePart({
                assetMaintenance: schedulePreventiveById.assetMaintenance,
                sparePart: item.sparePart,
                quantity: item.qty,
                replacementDate: new Date(),
                originSparePart: schedulePrevetiveSparePartRequest._id,
            });
        }
        await schedulePrevetiveTaskSparePartRequestService.createSchedulePrevetiveSparePartRequestDetail(detailPayload);
        await schedulePrevetiveTaskSparePartRequestService.changeState(
            schedulePreventive,
            schedulePreventiveTask,
            req.user.id,
            schedulePrevetiveSparePartRequest._id
        );
    }
    // updete data sparePartDetail nếu phiếu gửi có kiểu là spareReplace và có sparePartDetail
    const spareReplaceDetails = schedulePreventiveRequestSpareParts.filter(
        (item) => item.spareRequestType === 'spareReplace' && item.sparePartDetail
    );
    if (spareReplaceDetails.length > 0) {
        await SparePartDetail.updateMany(
            {
                qrCode: { $in: spareReplaceDetails.map((x) => x.sparePartDetail) },
            },
            {
                $set: {
                    replacementDate: new Date(),
                    updatedBy: req.user.id,
                    assetMaintenance: assetMaintenance,
                },
            }
        );
    }
    // tạo thông báo
    const notificationContent = {
        notificationTypeCode: notificationTypeCode.request_for_spare_parts_for_maintenance,
        isNotifyTheManager: true,
        text: `Yêu cầu phụ tùng bảo trì : ${schedulePrevetiveSparePartRequest.code}`,
        subUrl: `spare-part-request-schedule-preventive-detail/${schedulePrevetiveSparePartRequest._id}`,
        webSubUrl: `maintenance/work-order-schedule-preventive/view/${schedulePrevetiveSparePartRequest.schedulePreventive}`,
        notificationName: 'Yêu cầu phụ tùng bảo trì',
    };
    await notificationService.pushNotification(notificationContent);
    res.status(httpStatus.CREATED).send({ code: 1 });
});
const querySchedulePrevetiveTaskSparePartRequests = catchAsync(async (req, res) => {
    const filter = pick(req.body, [
        'schedulePreventive',
        'schedulePreventiveTask',
        'code',
        'status',
        'assignUserDate',
        'endDate',
        'startDate',
        'sparePartCode',
        'branchs',
    ]);
    const options = pick(req.body, ['sortBy', 'limit', 'page', 'sortOrder']);
    const results = await schedulePrevetiveTaskSparePartRequestService.querySchedulePrevetiveTaskSparePartRequests(
        filter,
        options,
        req
    );
    const data = await Promise.all(
        results?.results.map(async (item) => {
            const schedulePrevetiveTaskSparePartRequest = item.toObject();
            schedulePrevetiveTaskSparePartRequest.schedulePrevetiveTaskSparePartRequestDetails =
                await schedulePrevetiveTaskSparePartRequestService.getSchedulePrevetiveTaskRequestSparePartRequestDetailByRes(
                    {
                        schedulePrevetiveTaskSparePartRequest: item._id,
                    }
                );
            schedulePrevetiveTaskSparePartRequest.schedulePreventiveObject = await preventiveService.getPreventiveBySchedulePreventive(
                item?.schedulePreventiveTask?.schedulePreventive
            );
            return schedulePrevetiveTaskSparePartRequest;
        })
    );
    res.status(httpStatus.OK).send({
        code: 1,
        data,
        totalResults: results.totalResults,
        limit: results.limit,
        page: results.page,
        totalPages: results.totalPages,
    });
});
const comfirmSendSparePart = catchAsync(async (req, res) => {
    const { user, schedulePrevetiveTaskSparePartRequest, schedulePrevetiveTaskSparePartRequestDetails } = req.body;

    // check tồn kho
    if (req.body.enableIssue) {
        const resultMap = {};

        for (const detail of req.body.schedulePrevetiveTaskSparePartRequestDetails) {
            if (detail.requestStatus !== schedulePreventiveTaskRequestSparePartDetailStatus.pendingApproval) continue;

            const { id, sparePartsName } = detail.sparePart;

            if (!resultMap[id]) {
                resultMap[id] = {
                    id,
                    sparePartsName,
                    qty: 0
                };
            }

            resultMap[id].qty += detail.qty;
        }

        const result = Object.values(resultMap);


        const companySetting = await userService.getCompanySetting(req.company);

        const inventory = await inventoryService.getInventoryBySparePartsAndLocation({
            spareParts: result.map(i => i.id),
            stockLocation: companySetting.locationDefault,
        });

        // Map tồn kho theo sparePartId
        const inventoryMap = inventory.reduce((acc, item) => {
            acc[item.sparePartId] = item.totalQty;
            return acc;
        }, {});

        // Check số lượng
        for (const item of result) {
            const totalQty = inventoryMap[item.id] ?? 0;

            if (item.qty > totalQty) {
                throw new Error(
                    `Phụ tùng: ${item.sparePartsName} không đủ tồn kho. Yêu cầu: ${item.qty}, Tồn: ${totalQty}`
                );
            }
        }
    }


    const schedulePreventiveTaskAssignUser = await schedulePrevetiveTaskSparePartRequestService.comfirmSendSparePart(
        user,
        schedulePrevetiveTaskSparePartRequest,
        schedulePrevetiveTaskSparePartRequestDetails
    );
    if (schedulePreventiveTaskAssignUser && schedulePreventiveTaskAssignUser?.schedulePreventive) {
        // tạo thông báo
        const schedulePreventive = await schedulePreventiveService.getSchedulePreventiveByIdNotPopulate(
            schedulePreventiveTaskAssignUser?.schedulePreventive
        );
        const notificationContent = {
            notificationTypeCode: notificationTypeCode.maintenance_approval_has_been_submitted,
            text: `Phụ tùng đã được gửi đi, công việc bảo trì : ${schedulePreventive.code}`,
            subUrl: `cong-viec/chi-tiet/${schedulePreventiveTaskAssignUser._id}`,
            webSubUrl: `maintenance/work-order-schedule-preventive/view/${schedulePreventiveTaskAssignUser.schedulePreventive}`,
            notificationName: 'Đã gửi phụ tùng yêu cầu của bảo trì',
            user: user,
        };
        await notificationService.pushNotificationWithUser(notificationContent);

        //
        const payload = {
            processedAt: new Date(),
            processedBy: req.user.id,
            status: "PROCESSED"
        }
        await approvalTaskService.updateApprovalTaskBySourceId(schedulePrevetiveTaskSparePartRequest, payload);

    }

    // tẠO PHIẾU XUẤT KHO SỬ DỤNG
    if (req.body.enableIssue && schedulePreventiveTaskAssignUser) {
        const stockIssueDetail = req.body.schedulePrevetiveTaskSparePartRequestDetails
            .filter(br => br.requestStatus === schedulePreventiveTaskRequestSparePartDetailStatus.pendingApproval)
            .map(br => ({
                itemType: "SpareParts",
                uomId: br.sparePart.uomId.id,
                item: br.sparePart.id,
                qty: br.qty,
                unitPrice: br.unitCost,
                note: "yêu cầu phụ tùng bảo trì",
                createdBy: req.user.id,
            }));

        const receiverUsers = req.body.userIds?.length > 0 ? req.body.userIds : [req.body.user];
        const payload = {
            stockIssueDetail: stockIssueDetail,
            stockIssue: {
                exportType: "USAGE",
                issueDate: new Date(),
                issuedBy: req.user.id,
                receiverUsers: receiverUsers,
                createdBy: req.user.id,
                updatedBy: req.user.id,
                code: await sequenceService.generateSequenceCode('STOCK_ISSUE'),
            }
        }
        await stockIssueService.createStockIssueFromSpareRequest(payload, req.company.id);
    }
    res.send({ code: 1, data: schedulePreventiveTaskAssignUser });
});
const getScheduleePreventiveRequestSparePartById = catchAsync(async (req, res) => {
    const { id } = req.body;
    const schedulePreventiveServiceConfirm =
        await schedulePrevetiveTaskSparePartRequestService.getScheduleePreventiveRequestSparePartById(id);
    res.send({ code: 1, data: schedulePreventiveServiceConfirm });
});

module.exports = {
    createSchedulePreventiveSparePartRequest,
    querySchedulePrevetiveTaskSparePartRequests,
    comfirmSendSparePart,
    getScheduleePreventiveRequestSparePartById,
};
