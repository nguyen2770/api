const httpStatus = require('http-status');
const { Types } = require('mongoose');
const { schedulePreventiveService, approvalTaskService, schedulePrevetiveTaskSparePartRequestService } = require('..');
const {
    SchedulePrevetiveTaskSparePartRequestModel,
    SchedulePrevetiveTaskSparePartRequestDetailModel,
    SchedulePreventiveTaskAssignUserModel,
    SchedulePreventiveModel,
    ApprovalTaskModel,
    Department,
    AssetMaintenance,
} = require('../../models');
const ApiError = require('../../utils/ApiError');
const {
    schedulePreventiveTaskAssignUserStatus,
    schedulePreventiveTaskRequestSparePartStatus,
    schedulePreventiveStatus,
    schedulePreventiveTaskRequestSparePartDetailStatus,
    approvedTaskType,
} = require('../../utils/constant');

const createschedulePrevetiveSparePartRequest = async (data) => {
    const schedulePrevetiveSparePartRequest = await SchedulePrevetiveTaskSparePartRequestModel.create(data);
    if (schedulePrevetiveSparePartRequest.requestStatus === 'pending_approval') {
        const approvalData = await buildSchedulePrevetiveSparePartRequestData(schedulePrevetiveSparePartRequest._id);

        await ApprovalTaskModel.create({
            sourceType: approvedTaskType.spare_request_schedule_preventive,
            sourceId: schedulePrevetiveSparePartRequest._id,
            title: 'Duyệt yêu cầu phụ tùng',
            description: `Công việc ${schedulePrevetiveSparePartRequest.code}`,
            data: approvalData,
            requestUser: data.createdBy,
        });
    }
    return schedulePrevetiveSparePartRequest;
};
const createSchedulePrevetiveSparePartRequestDetail = async (data) => {
    const schedulePrevetiveSparePartRequestDetail = await SchedulePrevetiveTaskSparePartRequestDetailModel.create(data);
    return schedulePrevetiveSparePartRequestDetail;
};
const changeState = async (schedulePreventive, schedulePreventiveTask, user, schedulePrevetiveSparePartRequest) => {
    const schedulePreventiveTaskSP = await SchedulePrevetiveTaskSparePartRequestModel.findById(
        schedulePrevetiveSparePartRequest
    );
    if (!schedulePreventiveTaskSP) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Schedule Preventive Spare Part Request not found');
    }
    const schedulePreventiveTaskAssignUser = await SchedulePreventiveTaskAssignUserModel.findOne({
        schedulePreventiveTask,
        schedulePreventive,
        user,
        isCancel: false,
    });
    if (!schedulePreventiveTaskAssignUser) {
        throw new ApiError(httpStatus.NOT_FOUND, 'schedulePreventiveTaskAssignUser not found');
    }
    const schedulePrevetiveTaskSparePartRequestDetails = await SchedulePrevetiveTaskSparePartRequestDetailModel.find({
        schedulePrevetiveTaskSparePartRequest: schedulePreventiveTaskSP._id,
        requestStatus: { $nin: [schedulePreventiveTaskRequestSparePartDetailStatus.spareReplace] },
    });
    if (schedulePrevetiveTaskSparePartRequestDetails.length > 0) {
        schedulePreventiveTaskAssignUser.status = schedulePreventiveTaskAssignUserStatus.pendingApproval;
        await schedulePreventiveTaskAssignUser.save();
        // check xem nó còn yêu cầu nào chưa duyệt không
        const countSchedulePrevetiveTaskSparePartRequest = await SchedulePrevetiveTaskSparePartRequestModel.countDocuments({
            _id: schedulePrevetiveSparePartRequest,
            requestStatus: {
                $nin: [
                    schedulePreventiveTaskRequestSparePartStatus.rejected,
                    schedulePreventiveTaskRequestSparePartStatus.spareReplace,
                ],
            },
        });
        const currentCheckinCheckout = await schedulePreventiveService.getCurrentCheckinCheckout(user);
        // check lần đầu tiên
        if (countSchedulePrevetiveTaskSparePartRequest === 0) {
            if (!currentCheckinCheckout) {
                throw new ApiError(httpStatus.NOT_FOUND, '⚠️ Kỹ thuật viên chưa bắt đầu công việc');
            }
            if (currentCheckinCheckout.schedulePreventiveTask.id !== schedulePreventiveTask) {
                throw new ApiError(httpStatus.NOT_FOUND, 'Kỹ thuật viên đang ở công việc khác');
            }
        }
        if (currentCheckinCheckout) {
            await schedulePreventiveService.checkOutSchedulePreventiveTask(currentCheckinCheckout.id);
        }
    } else {
        //cập nhật trạng thái hoàn thành phụ tùng
        schedulePreventiveTaskSP.requestStatus = schedulePreventiveTaskRequestSparePartStatus.spareReplace;
        await schedulePreventiveTaskSP.save();
    }
};
const querySchedulePrevetiveTaskSparePartRequests = async (filter, options, req) => {
    const filterMatch = {};
    // kiểm tra xem có được xem tất cả tài sản không
    let allowViewAll = true;
    if (req.companySetting.filterByAccount) {
        const dep = await Department.findById(req.user.department).select('allowViewAll');
        allowViewAll = dep?.allowViewAll;
    }
    const amQuery = {};
    if (filter.branchs && Array.isArray(filter.branchs) && filter.branchs.length > 0) {
        amQuery.branch = { $in: filter.branchs.map(id => Types.ObjectId(id)) };
    }
    if (!allowViewAll) {
        amQuery.department = Types.ObjectId(req?.user?.department);
    }

    if (Object.keys(amQuery).length > 0) {
        const validAssetMaintenances = await AssetMaintenance.find(amQuery).select('_id');
        const amIds = validAssetMaintenances.map(asset => asset._id);
        const validSchedulePreventive = await SchedulePreventiveModel.find({
            assetMaintenance: { $in: amIds }
        }).select('_id');
        const scIds = validSchedulePreventive.map(sc => sc._id);
        filterMatch.schedulePreventive = { $in: scIds };
    }
    if (filter.schedulePreventive) {
        filterMatch.schedulePreventive = Types.ObjectId(filter.schedulePreventive);
    }
    if (filter.schedulePreventiveTask) {
        filterMatch.schedulePreventiveTask = Types.ObjectId(filter.schedulePreventiveTask);
    }
    if (filter.sparePartCode) {
        filterMatch.code = filter.sparePartCode;
    }
    if (filter.code) {
        const schedulePreventives = await SchedulePreventiveModel.find({
            code: { $regex: filter.code, $options: 'i' },
        }).select('_id');
        if (schedulePreventives && schedulePreventives.length > 0) {
            filterMatch.schedulePreventive = {
                $in: schedulePreventives.map((sp) => sp._id),
            };
        } else {
            filterMatch.schedulePreventive = null;
        }
    }
    if (filter.status) {
        filterMatch.requestStatus = filter.status;
        delete filter.status;
    }

    const dateFilter = {};
    if (filter.startDate) {
        dateFilter.$gte = new Date(filter.startDate);
    }
    if (filter.endDate) {
        const end = new Date(filter.endDate);
        end.setHours(23, 59, 59, 999); // tính tới cuối ngày
        dateFilter.$lte = end;
    }
    if (Object.keys(dateFilter).length) {
        filterMatch.assignUserDate = { ...dateFilter };
    }
    const querySchedulePrevetiveTaskSparePartRequests = await SchedulePrevetiveTaskSparePartRequestModel.paginate(
        filterMatch,
        {
            ...options,
            populate: [
                { path: 'schedulePreventiveTask' },
                {
                    path: 'schedulePreventive',
                    populate: [
                        {
                            path: 'assetMaintenance',
                            populate: [
                                {
                                    path: 'assetModel',
                                    populate: [
                                        { path: 'asset' },
                                        { path: 'assetTypeCategory' },
                                        { path: 'manufacturer' },
                                        { path: 'subCategory' },
                                        { path: 'supplier' },
                                        { path: 'category' },
                                        { path: 'subCategory' },
                                    ],
                                },
                                { path: 'customer' },
                                { path: 'building' },
                                { path: 'floor' },
                                { path: 'department' },
                                { path: 'province' },
                                { path: 'commune' },
                            ],
                        },
                    ],
                },
                { path: 'createdBy' },
                { path: 'holder' },
            ],
        }
    );
    return querySchedulePrevetiveTaskSparePartRequests;
};
const getSchedulePrevetiveTaskRequestSparePartRequestDetailByRes = async (data) => {
    const schedulePrevetiveTaskRequestSpareParts = await SchedulePrevetiveTaskSparePartRequestDetailModel.find(
        data
    ).populate({ path: 'sparePart' });
    return schedulePrevetiveTaskRequestSpareParts;
};
const comfirmSendSparePart = async (
    user,
    schedulePrevetiveTaskSparePartRequest,
    schedulePrevetiveTaskSparePartRequestDetails
) => {
    const schedulePrevetiveTaskSparePartRequestById = await SchedulePrevetiveTaskSparePartRequestModel.findById(
        schedulePrevetiveTaskSparePartRequest
    );
    if (!schedulePrevetiveTaskSparePartRequestById) {
        throw new ApiError('Không tìm thấy yêu cầu thay thế phụ tùng');
    }
    if (schedulePrevetiveTaskSparePartRequestById.requestStatus === schedulePreventiveTaskRequestSparePartStatus.submitted) {
        throw new ApiError('Phụ tùng đã được gửi tới');
    }
    if (schedulePrevetiveTaskSparePartRequestById.requestStatus === schedulePrevetiveTaskSparePartRequestById.spareReplace) {
        throw new ApiError('Phụ tùng đã thay thế');
    }
    const schedulePreventiveById = await SchedulePreventiveModel.findById(
        schedulePrevetiveTaskSparePartRequestById.schedulePreventive
    );
    if (!schedulePreventiveById && !schedulePreventiveById.assetMaintenance) {
        throw new ApiError('Không tìm thấy phiếu bảo trì');
    }
    if (schedulePrevetiveTaskSparePartRequestDetails && schedulePrevetiveTaskSparePartRequestDetails.length > 0) {
        for (const element of schedulePrevetiveTaskSparePartRequestDetails) {
            if (element.requestStatus === schedulePreventiveTaskRequestSparePartStatus.spareReplace) {
                continue;
            }
            const payload = { requestStatus: element.requestStatus };
            if (element.requestStatus !== schedulePreventiveTaskRequestSparePartStatus.rejected) {
                payload.qty = element.qty;
                payload.unitCost = element.unitCost;
            } else {
                payload.rejectedDate = Date.now();
            }
            await SchedulePrevetiveTaskSparePartRequestDetailModel.findByIdAndUpdate(element.id, payload);
        }
    }
    const details = await SchedulePrevetiveTaskSparePartRequestDetailModel.find({
        schedulePrevetiveTaskSparePartRequest,
        requestStatus: {
            $nin: [
                schedulePreventiveTaskRequestSparePartDetailStatus.rejected,
                schedulePreventiveTaskRequestSparePartDetailStatus.spareReplace,
            ],
        },
    });
    let schedulePreventiveTaskAssignUser = {};
    if (details.length === 0) {
        // Không có phụ tùng nào hợp lệ => giữ nguyên hoặc set inProgress
        await SchedulePrevetiveTaskSparePartRequestModel.findByIdAndUpdate(schedulePrevetiveTaskSparePartRequest, {
            requestStatus: schedulePreventiveTaskRequestSparePartStatus.rejected,
        });
    } else {
        // các bản ghi yêu cầu phụ tùng đã duyệt hết chưa
        const schedeulePrevetiveTaskRequestSpareParts = await SchedulePrevetiveTaskSparePartRequestModel.countDocuments({
            schedulePreventiveTask: schedulePrevetiveTaskSparePartRequestById.schedulePreventiveTask,
            requestStatus: {
                $nin: [
                    schedulePreventiveTaskRequestSparePartStatus.rejected,
                    schedulePreventiveTaskRequestSparePartStatus.spareReplace,
                    schedulePreventiveTaskRequestSparePartStatus.submitted,
                ],
            },
        });
        // lấy ra user đang active trên task này
        const userActived = await SchedulePreventiveTaskAssignUserModel.findOne({
            schedulePreventiveTask: schedulePrevetiveTaskSparePartRequestById.schedulePreventiveTask,
            isCancel: false,
            status: { $ne: schedulePreventiveTaskAssignUserStatus.replacement },
        });
        if (!userActived) {
            throw new ApiError('Không tìm thấy kỹ thuật viên thực hiện');
        }

        if (Types.ObjectId(user).equals(userActived.user)) {
            // tất cả bản ghi yêu cầu phụ tùng là bản ghi cuối cùng
            if (schedeulePrevetiveTaskRequestSpareParts === 1) {
                schedulePreventiveTaskAssignUser = await SchedulePreventiveTaskAssignUserModel.findOneAndUpdate(
                    {
                        user,
                        schedulePreventiveTask: schedulePrevetiveTaskSparePartRequestById.schedulePreventiveTask,
                        isCancel: false,
                    },
                    { $set: { status: schedulePreventiveTaskAssignUserStatus.submitted } }
                );
            }
        } else {
            // Người khác gửi thay
            schedulePreventiveTaskAssignUser = await SchedulePreventiveTaskAssignUserModel.findOneAndUpdate(
                {
                    user: userActived.user,
                    schedulePreventiveTask: schedulePrevetiveTaskSparePartRequestById.schedulePreventiveTask,
                    isCancel: false,
                },
                {
                    $set: { status: schedulePreventiveTaskAssignUserStatus.replacement },
                }
                // { upsert: true } // nếu chưa có thì tự động tạo
            );

            // Kiểm tra xem user hiện tại có đang check-in ở công việc khác không
            const currentCheckinCheckout = await schedulePreventiveService.getCurrentCheckinCheckout(userActived.user);
            if (currentCheckinCheckout) {
                await schedulePreventiveService.checkOutSchedulePreventiveTask(currentCheckinCheckout.id);
            }

            // Kiểm tra số lượng người được giao cho công việc này
            const count = await schedulePreventiveService.getCountSchedulePrevetiveTaskAssignUserByTask(
                schedulePrevetiveTaskSparePartRequestById.schedulePreventiveTask
            );

            if (count > 1) {
                throw new ApiError(httpStatus.BAD_REQUEST, 'Một công việc chỉ được phép giao cho 1 kỹ sư thực hiện');
            }

            // Kiểm tra xem user mới đã có bản ghi chưa, tránh tạo trùng
            const existingAssign = await SchedulePreventiveTaskAssignUserModel.findOne({
                user,
                schedulePreventiveTask: schedulePrevetiveTaskSparePartRequestById.schedulePreventiveTask,
                isCancel: false,
            });

            if (existingAssign) {
                existingAssign.status = schedulePreventiveTaskAssignUserStatus.assigned;
                existingAssign.save();
            } else {
                await SchedulePreventiveTaskAssignUserModel.create({
                    user,
                    schedulePreventiveTask: schedulePrevetiveTaskSparePartRequestById.schedulePreventiveTask,
                    schedulePreventive: schedulePrevetiveTaskSparePartRequestById.schedulePreventive,
                });
            }
        }

        // Cập nhật phiếu và chi tiết khi có phụ tùng hợp lệ
        await SchedulePrevetiveTaskSparePartRequestModel.findByIdAndUpdate(schedulePrevetiveTaskSparePartRequest, {
            requestStatus: schedulePreventiveTaskRequestSparePartStatus.submitted,
            holder: user,
            assignUserDate: Date.now(),
        });

        const detailIds = details.map((d) => d._id);
        await SchedulePrevetiveTaskSparePartRequestDetailModel.updateMany(
            { _id: { $in: detailIds }, requestStatus: { $ne: schedulePreventiveTaskRequestSparePartDetailStatus.rejected } },
            { requestStatus: schedulePreventiveTaskRequestSparePartStatus.submitted }
        );

        await schedulePreventiveService.updateSchedulePreventiveById(
            schedulePrevetiveTaskSparePartRequestById.schedulePreventive,
            { status: schedulePreventiveStatus.submitted }
        );
    }
    return schedulePreventiveTaskAssignUser;
};
const getScheduleePreventiveRequestSparePartByRes = async (data) => {
    const scheduleePreventiveRequestSpareParts = await SchedulePrevetiveTaskSparePartRequestModel.find(data)
        .populate([
            { path: 'createdBy' },
            { path: 'holder' },
            { path: 'schedulePreventive' },
            { path: 'schedulePreventiveTask' },
        ])
        .sort({
            createdAt: -1,
        });
    const results = await Promise.all(
        scheduleePreventiveRequestSpareParts.map(async (item) => {
            const details = await SchedulePrevetiveTaskSparePartRequestDetailModel.find({
                schedulePrevetiveTaskSparePartRequest: item._id,
            }).populate([{ path: 'sparePart' }]);
            return {
                ...item.toObject(),
                scheduleePreventiveRequestSparePartDetails: details,
            };
        })
    );
    return results;
};
const countSchedulePreventiveTaskRequestSparePartBySchedulePreventiveTaskId = async (schedulePreventiveTaskId) => {
    const schedeulePrevetiveTaskRequestSpareParts = await SchedulePrevetiveTaskSparePartRequestModel.countDocuments({
        schedulePreventiveTask: schedulePreventiveTaskId,
        requestStatus: {
            $nin: [
                schedulePreventiveTaskRequestSparePartStatus.rejected,
                schedulePreventiveTaskRequestSparePartStatus.spareReplace,
                schedulePreventiveTaskRequestSparePartStatus.submitted,
            ],
        },
    });
    return schedeulePrevetiveTaskRequestSpareParts;
};
const getSchedulePreventiveTaskRequestSparePartLatest = async (schedulePreventiveTaskId) => {
    const schedeulePrevetiveTaskRequestSparePart = await SchedulePrevetiveTaskSparePartRequestModel.findOne({
        schedulePreventiveTask: schedulePreventiveTaskId,
        requestStatus: {
            $nin: [
                schedulePreventiveTaskRequestSparePartStatus.rejected,
                schedulePreventiveTaskRequestSparePartStatus.spareReplace,
                schedulePreventiveTaskRequestSparePartStatus.submitted,
            ],
        },
    })
        .sort({ createdAt: -1 })
        .exec();
    if (!schedeulePrevetiveTaskRequestSparePart) {
        throw new ApiError('schedeulePrevetiveTaskRequestSparePart not fundtion');
    }

    return schedeulePrevetiveTaskRequestSparePart;
};
const getScheduleePreventiveRequestSparePartById = async (id) => {
    const scheduleePreventiveRequestSpareParts = await SchedulePrevetiveTaskSparePartRequestModel.findById(id).populate([
        { path: 'createdBy' },
        { path: 'holder' },
        { path: 'schedulePreventive' },
        { path: 'schedulePreventiveTask' },
    ]);
    const data = scheduleePreventiveRequestSpareParts.toObject();
    data.scheduleePreventiveRequestSparePartDetails = await SchedulePrevetiveTaskSparePartRequestDetailModel.find({
        schedulePrevetiveTaskSparePartRequest: scheduleePreventiveRequestSpareParts._id,
    }).populate([{ path: 'sparePart' }]);

    return data;
};
const buildSchedulePrevetiveSparePartRequestData = async (id) => {
    const item = await SchedulePrevetiveTaskSparePartRequestModel.findById(id).populate([
        { path: 'schedulePreventiveTask' },
        {
            path: 'schedulePreventive',
            populate: {
                path: 'assetMaintenance',
                populate: [
                    {
                        path: 'assetModel',
                        populate: ['asset', 'assetTypeCategory', 'manufacturer', 'subCategory', 'supplier', 'category'],
                    },
                    'customer',
                    'building',
                    'floor',
                    'department',
                    'province',
                    'commune',
                ],
            },
        },
        'createdBy',
        'holder',
    ]);

    if (!item) return null;

    const obj = item.toObject();

    obj.schedulePrevetiveTaskSparePartRequestDetails = await getSchedulePrevetiveTaskRequestSparePartRequestDetailByRes({
        schedulePrevetiveTaskSparePartRequest: id,
    });

    return obj;
};

module.exports = {
    createschedulePrevetiveSparePartRequest,
    createSchedulePrevetiveSparePartRequestDetail,
    changeState,
    querySchedulePrevetiveTaskSparePartRequests,
    getSchedulePrevetiveTaskRequestSparePartRequestDetailByRes,
    comfirmSendSparePart,
    getScheduleePreventiveRequestSparePartByRes,
    countSchedulePreventiveTaskRequestSparePartBySchedulePreventiveTaskId,
    getSchedulePreventiveTaskRequestSparePartLatest,
    getScheduleePreventiveRequestSparePartById,
};
