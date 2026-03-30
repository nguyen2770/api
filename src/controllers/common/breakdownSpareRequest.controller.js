const { Types } = require('mongoose');
const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const catchAsync = require('../../utils/catchAsync');
const {
    breakdownSpareRequestService,
    breakdownAssignUserService,
    sequenceService,
    breakdownService,
    approvalTaskService,
    assetModelSparePartService,
    assetMaintenanceService,
    stockIssueService,
    userService,
    inventoryService,
} = require('../../services');
const notificationService = require('../../services/notification/notification.service');
const { notificationTypeCode, breakdownSpareRequestDetailStatus, breakdownSpareRequestStatus } = require('../../utils/constant');

const createBreakdownSpareRequests = catchAsync(async (req, res) => {
    req.body = {
        ...req.body,
        spareRequest: {
            ...req.body.spareRequest,
            code: await sequenceService.generateSequenceCode('BREAKDOWN_SPARE_REQUEST'),
            createdBy: req.user.id,
            updatedBy: req.user.id,
        },
    };
    let breakdownSpareRequest;
    let breakdownSpareRequestDetail;

    const lastApprovedDoc = await breakdownSpareRequestService.getLastDocStatusApproved(req.body.spareRequest?.breakdown);

    if (lastApprovedDoc) {
        breakdownSpareRequest = lastApprovedDoc;
        breakdownSpareRequestDetail = await breakdownSpareRequestService.appendSpareRequestDetails(
            lastApprovedDoc._id,
            req.body.spareRequestDetail
        );
    } else {
        const result = await breakdownSpareRequestService.createBreakdownSpareRequest(req.body);
        breakdownSpareRequest = result.breakdownSpareRequest;
        breakdownSpareRequestDetail = result.breakdownSpareRequestDetail;
    }
    // kiểm tra nếu là spareReplace thì tạo history
    const spareRequestDetails = req.body.spareRequestDetail || [];
    for (const spareRequestDetailItem of spareRequestDetails) {
        const assetModelSparePart = await assetModelSparePartService.getAssetModelSparePartById(
            spareRequestDetailItem.assetModelSparePart
        );
        if (spareRequestDetailItem.spareRequestType === breakdownSpareRequestDetailStatus.spareReplace)
            await assetMaintenanceService.createHistoryAssetMaintenanceSparePart({
                assetMaintenance: req.body.spareRequest.assetMaintenance || null,
                sparePart: assetModelSparePart.sparePart,
                quantity: spareRequestDetailItem.qty,
                replacementDate: new Date(),
                originSparePart: breakdownSpareRequest._id,
            });
    }
    // Push notification to manager
    const notificationContent = {
        notificationTypeCode: notificationTypeCode.spare_part_request_breakdown,
        isNotifyTheManager: true, // nếu bằng tru thì cần phải nhập người quản lý để thông báo
        text: `Yêu cầu phụ tùng thay thế : ${breakdownSpareRequest.code}`,
        subUrl: `spare-part-request-breakdown-detail/${breakdownSpareRequest._id}`,
        webSubUrl: `breakdown/work-order-breakdown/view/${breakdownSpareRequest.breakdown}`,
        notificationName: 'Yêu cầu phụ tùng sự cố',
    };
    await notificationService.pushNotification(notificationContent);

    res.status(httpStatus.CREATED).send({
        code: 1,
        data: {
            breakdownSpareRequest,
            breakdownSpareRequestDetail,
        },
    });
});

function toStartOfDay(dateStr) {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    return d;
}

function toEndOfDay(dateStr) {
    const d = new Date(dateStr);
    d.setHours(23, 59, 59, 999);
    return d;
}

const queryBreakdownSpareRequests = catchAsync(async (req, res) => {
    let filter = pick(req.body, ['breakdownCode', 'status', 'startDate', 'endDate', 'code', 'branchs']);
    const options = pick(req.body, ['sortBy', 'limit', 'page', 'sortOrder']);

    if (filter.startDate) filter.startDate = toStartOfDay(filter.startDate);
    if (filter.endDate) filter.endDate = toEndOfDay(filter.endDate);
    const result = await breakdownSpareRequestService.queryBreakdownSpareRequests(filter, options, req);
    res.send({ results: result, code: 1 });
});

const deleteBreakdownSpareRequest = catchAsync(async (req, res) => {
    await breakdownSpareRequestService.deleteBreakdownSpareRequest(req.query.id);
    res.status(httpStatus.OK).send({ code: 1 });
});

const findBreakdownSpareRequestById = catchAsync(async (req, res) => {
    const breakdownSpareRequest = await breakdownSpareRequestService.findBreakdownSpareRequestById(req.query.id);
    res.status(httpStatus.OK).send({ code: 1, data: breakdownSpareRequest });
});
const updateBreakdownSpareRequestDetail = catchAsync(async (req, res) => {
    const updated = await breakdownSpareRequestService.updateBreakdownSpareRequestDetail(req.params.id, req.body);
    res.send({ code: 1, data: updated });
});

const queryBreakdownSpareRequestByBreakdown = catchAsync(async (req, res) => {
    let filter = pick(req.query, ['breakdown', 'status', 'startDate', 'endDate', 'code']);
    const options = pick(req.query, ['sortBy', 'limit', 'page', 'sortOrder']);
    const breakdownSpareRequest = await breakdownSpareRequestService.queryBreakdownSpareRequestByBreakdown(filter, options);
    res.send({ code: 1, data: breakdownSpareRequest });
});

const getAllBreakdownSpareRequestBySpareRequestId = catchAsync(async (req, res) => {
    const breakdownSpareRequest = await breakdownSpareRequestService.getAllBreakdownSpareRequestBySpareRequestId(
        req.query.id
    );
    res.send({ code: 1, data: breakdownSpareRequest });
});

const updateData = catchAsync(async (req, res) => {
    const { id, ...updateData1 } = req.body.breakdownSpareRequest;
    // updateData.updatedBy = req.user.id; // Nếu cần
    const updated = await breakdownSpareRequestService.updateData(id, updateData1);
    res.send({ code: 1, data: updated });
});
const assignUserFromSpareRequest = catchAsync(async (req, res) => {
    const { breakdownSpareRequestId, userIds, comment } = req.body;
    const spareRequest = await breakdownAssignUserService.assignUserFromSpareRequest(
        breakdownSpareRequestId,
        comment,
        userIds.map((_u) => Types.ObjectId(_u))
    );
    res.send({ code: 1, data: spareRequest });
});
const getBreakdownSparePartResByRes = catchAsync(async (req, res) => {
    const list = await breakdownSpareRequestService.getBreakdownSparePartResByRes({
        breakdown: req.query.breakdown,
    });

    // Lồng thêm assignUser cho từng item
    const finalResult = await Promise.all(
        list.map(async (item) => {
            const assignUsers = await breakdownSpareRequestService.breakdownSpareRequestAssignUserBybreakdownSpareRequest({
                breakdownSpareRequest: item._id || item.id,
            });
            return {
                ...(item.toObject?.() || item), // Nếu là mongoose document
                assignUsers,
            };
        })
    );

    res.send({ code: 1, data: finalResult });
});

const approveBreakdownSpareRequest = catchAsync(async (req, res) => {

    // check số lượng trong kho
    if (req.body.enableIssue) {
        const resultMap = {};

        for (const detail of req.body.breakdownSpareRequestDetails) {
            if (detail.requestStatus !== breakdownSpareRequestDetailStatus.approved) continue;

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


    const breakdownSpareRequest = await breakdownSpareRequestService.approveBreakdownSpareRequest({
        breakdownSpareRequestId: req.params.breakdownSpareRequestId,
        breakdownSpareRequestDetails: req.body.breakdownSpareRequestDetails,
        userId: req.body.user,
        userIds: req.body.userIds
    });
    if (breakdownSpareRequest?.breakdown) {
        const breakdown = await breakdownService.getBreakdownByIdNoPopulate(breakdownSpareRequest?.breakdown);
        if (req.body.userIds && req.body.userIds.length > 0) {
            console.log(req.body.userIds);
            const notificationContent = {
                notificationTypeCode: notificationTypeCode.spare_parts_have_been_shipped,
                text: `Phụ tùng đã được gửi đến, sự cố : ${breakdown.code}`,
                subUrl: `view-my-breakdown/${breakdown._id}`,
                webSubUrl: `breakdown/work-order-breakdown/view/${breakdown._id}`,
                notificationName: 'Phụ tùng đã gửi',
                users: req.body.userIds,
            };
            await notificationService.pushNotificationWithUsers(notificationContent);
        } else {
            const notificationContent = {
                notificationTypeCode: notificationTypeCode.spare_parts_have_been_shipped,
                text: `Phụ tùng đã được gửi đến, sự cố : ${breakdown.code}`,
                subUrl: `view-my-breakdown/${breakdown._id}`,
                webSubUrl: `breakdown/work-order-breakdown/view/${breakdown._id}`,
                notificationName: 'Phụ tùng đã gửi',
                user: req.body.user,
            };
            await notificationService.pushNotificationWithUser(notificationContent);
        }
        if (breakdownSpareRequest) {
            const payload = {
                processedAt: new Date(),
                processedBy: req.user.id,
                status: 'PROCESSED',
            };
            await approvalTaskService.updateApprovalTaskBySourceId(req.params.breakdownSpareRequestId, payload);
        }
    }

    // tẠO PHIẾU XUẤT KHO SỬ DỤNG
    if (req.body.enableIssue && breakdownSpareRequest) {
        const stockIssueDetail = req.body.breakdownSpareRequestDetails
            .filter(br => br.requestStatus === breakdownSpareRequestStatus.approved)
            .map(br => ({
                itemType: "SpareParts",
                uomId: br.sparePart.uomId.id,
                item: br.sparePart.id,
                qty: br.qty,
                unitPrice: br.unitCost,
                note: "yêu cầu phụ tùng sự cố",
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

    res.send({ code: 1, data: breakdownSpareRequest });
});

const updateBreakdownSpareRequest = catchAsync(async (req, res) => {
    req.body = {
        ...req.body,
        spareRequest: {
            ...req.body.spareRequest,
            updatedBy: req.user.id,
        },
    };
    console.log(req.body);

    const breakdownSpareRequest = await breakdownSpareRequestService.updateBreakdownSpareRequest(req.body);
    res.send({ code: 1, data: breakdownSpareRequest });
});

module.exports = {
    createBreakdownSpareRequests,
    queryBreakdownSpareRequests,
    deleteBreakdownSpareRequest,
    updateBreakdownSpareRequest,
    updateBreakdownSpareRequestDetail,
    findBreakdownSpareRequestById,
    queryBreakdownSpareRequestByBreakdown,
    getAllBreakdownSpareRequestBySpareRequestId,
    updateData,
    assignUserFromSpareRequest,
    getBreakdownSparePartResByRes,
    approveBreakdownSpareRequest,
};
