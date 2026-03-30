const mongoose = require('mongoose');
const {
    BreakdownSpareRequest,
    BreakdownSpareRequestDetail,
    BreakdownAssignUserModel,
    BreakdownSpareRequestAssignUserModel,
    Breakdown,
    SparePartDetail,
    ApprovalTaskModel,
    AssetMaintenance,
    User,
    HistoryAssetMaintenanceSparePartModel,
    Department,
} = require('../../models');
const { sparePartsService, breakdownAssignUserService, breakdownService, assetModelSparePartService } = require('..');
const {
    breakdownAssignUserStatus,
    breakdownSpareRequestStatus,
    breakdownSpareRequestDetailStatus,
    approvedTaskType,
} = require('../../utils/constant');
const { default: xFrameOptions } = require('helmet/dist/middlewares/x-frame-options');
const SchedulePrevetiveTaskSparePartRequestDetail = require('../../models/preventive/schedulePrevetiveTaskSparePartRequestDetail.model');

const nextRequestStatus = (_currentRequestStatus) => {
    switch (_currentRequestStatus) {
        case breakdownSpareRequestStatus.approved:
            return breakdownSpareRequestStatus.submitted;
        default:
            return _currentRequestStatus;
    }
};

const createBreakdownSpareRequest = async (data) => {
    const { spareRequest, spareRequestDetail } = data;
    const allSpareReplace = spareRequestDetail.every((item) => item.spareRequestType === 'spareReplace');

    let requestStatus = breakdownSpareRequestStatus.approved;
    let assignUserDate = null;

    if (allSpareReplace) {
        requestStatus = breakdownSpareRequestStatus.spareReplace;
        assignUserDate = Date.now();
    }
    // Tạo bản ghi yêu cầu chính
    const spareRequestDoc = new BreakdownSpareRequest({ ...spareRequest, requestStatus, assignUserDate });
    const breakdownSpareRequest = await spareRequestDoc.save();
    // Chuẩn bị chi tiết yêu cầu
    const detailToInsert = spareRequestDetail.map((item) => ({
        ...item,
        breakdownSpareRequest: breakdownSpareRequest._id,
    }));
    const breakdownSpareRequestDetail = await BreakdownSpareRequestDetail.insertMany(detailToInsert);
    // Kiểm tra nếu có ít nhất 1 spareRequest thì thực hiện logout
    const hasSpareReplace = spareRequestDetail.some((item) => item.spareRequestType === 'spareRequest');

    // updete data sparePartDetail nếu phiếu gửi có kiểu là spareReplace và có sparePartDetail
    const spareReplaceDetails = spareRequestDetail.filter(
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
                    updatedBy: spareRequest.user,
                    assetMaintenance: spareRequest.assetMaintenance,
                },
            }
        );
    }

    if (hasSpareReplace) {
        const assignUser = await BreakdownAssignUserModel.findOneAndUpdate(
            { breakdown: spareRequest.breakdown, user: spareRequest.user },
            { $set: { status: requestStatus } },
            { sort: { updatedAt: -1 }, new: true }
        );
        if (!assignUser) throw new Error('Không tìm thấy BreakdownAssignUser');
        const latestCheckInCheckOut = await breakdownAssignUserService.getLatestBreakdownAssignUserCheckInCheckOut({
            breakdownAssignUser: assignUser._id,
        });
        if (!latestCheckInCheckOut) {
            throw new Error('AssetIdInfo not found');
        }
        const payloadUpdate = {
            logOutAt: new Date(),
            checkOutComments: 'gửi yêu cầu sparePart',
        };
        await breakdownAssignUserService.updateBreakdownAssignUserCheckInCheckOut(latestCheckInCheckOut.id, payloadUpdate);

        const breakdown = await Breakdown.findById(spareRequest.breakdown);
        const assetMaintenance = await AssetMaintenance.findById(spareRequest.assetMaintenance);
        // const user = await User.findById(spareRequest.user);
        const details = await getBreakdownSpareRequestDetails(breakdownSpareRequest._id);
        // tạo mới yêu cầu phê duyệt nhanh
        await ApprovalTaskModel.create({
            sourceType: approvedTaskType.spare_request_breakdown,
            sourceId: breakdownSpareRequest._id,
            title: 'Duyệt yêu cầu phụ tùng',
            description: `Sự cố ${breakdown.code}`,
            data: {
                ...breakdownSpareRequest.toJSON(),
                breakdown: {
                    ...breakdown.toJSON(),
                    assetMaintenance: assetMaintenance.toJSON(),
                },
                detail: details,
            },
            requestUser: spareRequest.user,
        });
    }

    return { breakdownSpareRequest, breakdownSpareRequestDetail };
};

const updateBreakdownSpareRequest = async (data) => {
    const { spareRequest, spareRequestDetail, id } = data;
    console.log(spareRequestDetail);
    const allSpareReplace = spareRequestDetail.every((item) => item.spareRequestType === 'spareReplace');

    let requestStatus = breakdownSpareRequestStatus.approved;
    let assignUserDate = null;
    if (allSpareReplace) {
        requestStatus = breakdownSpareRequestStatus.spareReplace;
        assignUserDate = Date.now();
    }
    // update bản ghi chính
    const breakdownSpareRequest = await BreakdownSpareRequest.findByIdAndUpdate(id, {
        ...spareRequest,
        requestStatus,
        assignUserDate,
    });

    await BreakdownSpareRequestDetail.deleteMany({ breakdownSpareRequest: id });

    // Chuẩn bị chi tiết yêu cầu
    const detailToInsert = spareRequestDetail.map((item) => ({
        ...item,
        breakdownSpareRequest: id,
    }));

    const breakdownSpareRequestDetail = await BreakdownSpareRequestDetail.insertMany(detailToInsert);

    return { breakdownSpareRequest, breakdownSpareRequestDetail };
};

const queryBreakdownSpareRequests = async (filter, options, req) => {
    let query = {};
    // kiểm tra xem có được xem tất cả tài sản không
    let allowViewAll = true;
    if (req.companySetting.filterByAccount) {
        const dep = await Department.findById(req.user.department).select('allowViewAll');
        allowViewAll = dep?.allowViewAll;
    }
    const amQuery = {};
    if (filter.branchs && Array.isArray(filter.branchs) && filter.branchs.length > 0) {
        amQuery.branch = { $in: filter.branchs.map((id) => mongoose.Types.ObjectId(id)) };
    }
    if (!allowViewAll) {
        amQuery.department = mongoose.Types.ObjectId(req?.user?.department);
    }

    if (Object.keys(amQuery).length > 0) {
        const validAssetMaintenances = await AssetMaintenance.find(amQuery).select('_id');
        const amIds = validAssetMaintenances.map((asset) => asset._id);
        const validBreakdown = await Breakdown.find({
            assetMaintenance: { $in: amIds },
        }).select('_id');
        const breakdownIds = validBreakdown.map((sc) => sc._id);
        query.breakdown = { $in: breakdownIds };
    }
    if (filter.code) {
        query.code = { $regex: filter.code };
    }
    if (filter.breakdownCode) {
        const breakdowns = await Breakdown.find({
            code: { $regex: filter.breakdownCode, $options: 'i' },
        }).select('_id');
        query.breakdown = { $in: breakdowns.map((b) => b._id) };
    }
    if (filter.status) {
        const statusArray = filter.status.split(',');
        query.requestStatus = { $in: statusArray };
    }
    if (filter.requestStatus) {
        query.requestStatus = filter.requestStatus;
    }

    if (filter.startDate && filter.endDate) {
        query.assignUserDate = {
            $gte: filter.startDate,
            $lte: filter.endDate,
        };
    } else if (filter.startDate) {
        query.assignUserDate = { $gte: filter.startDate };
    } else if (filter.endDate) {
        query.assignUserDate = { $lte: filter.endDate };
    }
    const breakdownSpareRequest = await BreakdownSpareRequest.paginate(query, {
        ...options,
        populate: {
            path: 'breakdown',
            populate: [
                {
                    path: 'assetMaintenance',
                    populate: [
                        {
                            path: 'assetModel',
                            populate: [
                                { path: 'asset' },
                                { path: 'manufacturer' },
                                { path: 'supplier' },
                                { path: 'category' },
                                { path: 'subCategory' },
                                { path: 'assetTypeCategory' },
                            ],
                        },
                        { path: 'customer' },
                        { path: 'department', select: 'departmentName' },
                        { path: 'branch', select: 'name' },
                    ],
                },
                { path: 'breakdownDefect', select: 'name' },
                { path: 'createdBy', select: 'username' },
            ],
        },
    });

    // Lấy tất cả BreakdownSpareRequestDetail cho từng request
    const breakdownIds = breakdownSpareRequest.results.map((doc) => doc._id);
    const details = await BreakdownSpareRequestDetail.find({ breakdownSpareRequest: { $in: breakdownIds } })
        .populate({
            path: 'assetModelSparePart',
            populate: { path: 'sparePart', select: 'sparePartsName' },
        })
        .populate({
            path: 'breakdownSpareRequest',
            select: 'createdBy',
            populate: { path: 'createdBy', select: 'fullName' },
        });

    // Gom details theo breakdownSpareRequest
    const detailsMap = details.reduce((acc, detail) => {
        const id = detail.breakdownSpareRequest._id.toString();
        if (!acc[id]) acc[id] = [];
        acc[id].push(detail);
        return acc;
    }, {});

    // Gắn details vào từng BreakdownSpareRequest
    const docsWithDetails = breakdownSpareRequest.results.map((doc) => ({
        ...doc.toJSON(),
        details: detailsMap[doc._id.toString()] || [],
    }));

    return {
        ...breakdownSpareRequest,
        results: docsWithDetails,
    };
};

const deleteBreakdownSpareRequest = async (id) => {
    const breakdownSpareRequestDetail = await BreakdownSpareRequestDetail.findByIdAndDelete(id);
    const breakdownSpareRequest = await BreakdownSpareRequest.findById(breakdownSpareRequestDetail.breakdownSpareRequest);
    if (!breakdownSpareRequest) {
        throw new Error('Breakdown Spare Request not found');
    }
    // check nếu mà delete hết breakdownSpareRequestDetail thì sẽ update trạng thái của BreakdownAssignUserModel
    const relatedRequests = await BreakdownSpareRequestDetail.find({ breakdownSpareRequest: breakdownSpareRequest._id });

    if (relatedRequests.length === 0) {
        const assignUser = await BreakdownAssignUserModel.findOneAndUpdate(
            { breakdown: breakdownSpareRequest.breakdown },
            { $set: { status: breakdownAssignUserStatus.inProgress } },
            { new: true }
        );
        // xoá luôn phiếu yêu cầu
        await BreakdownSpareRequest.findByIdAndDelete(breakdownSpareRequest._id);

        if (!assignUser) {
            throw new Error('Không tìm thấy BreakdownAssignUser');
        }
    }

    return breakdownSpareRequest;
};

const findBreakdownSpareRequestById = async (id) => {
    const breakdownSpareRequest = await BreakdownSpareRequest.findById(id)
        .populate({ path: 'assetModelSparePart' })
        .populate({ path: 'breakdown' });
    return breakdownSpareRequest;
};

const updateBreakdownSpareRequestDetail = async (id, data) => {
    const breakdownSpareRequest = await BreakdownSpareRequestDetail.findByIdAndUpdate(id, data, { new: true });
    if (!breakdownSpareRequest) {
        throw new Error('Document not found');
    }
    return breakdownSpareRequest;
};

const queryBreakdownSpareRequestByBreakdown = async (filter, options) => {
    const page = Number(options.page) || 1;
    const limit = Number(options.limit) || 10;
    const skip = (page - 1) * limit;

    const match = {};

    if (filter.breakdown) {
        match.breakdown = new mongoose.Types.ObjectId(filter.breakdown);
    }

    if (filter.code) {
        match.code = { $regex: filter.code, $options: 'i' };
    }

    const pipeline = [
        { $match: match },

        { $sort: { createdAt: -1 } },

        {
            $lookup: {
                from: 'users',
                localField: 'createdBy',
                foreignField: '_id',
                as: 'createdBy',
            },
        },
        {
            $unwind: {
                path: '$createdBy',
                preserveNullAndEmptyArrays: true,
            },
        },

        // join detail
        {
            $lookup: {
                from: 'breakdownsparerequestdetails',
                localField: '_id',
                foreignField: 'breakdownSpareRequest',
                as: 'details',
            },
        },

        // join assetModelSparePart
        {
            $lookup: {
                from: 'assetmodelspareparts',
                localField: 'details.assetModelSparePart',
                foreignField: '_id',
                as: 'assetModelSpareParts',
            },
        },

        {
            $lookup: {
                from: 'spareparts',
                localField: 'assetModelSpareParts.sparePart',
                foreignField: '_id',
                as: 'spareParts',
            },
        },

        // map sparePart vào từng detail
        {
            $addFields: {
                details: {
                    $map: {
                        input: '$details',
                        as: 'd',
                        in: {
                            $let: {
                                vars: {
                                    amsp: {
                                        $arrayElemAt: [
                                            {
                                                $filter: {
                                                    input: '$assetModelSpareParts',
                                                    as: 'a',
                                                    cond: { $eq: ['$$a._id', '$$d.assetModelSparePart'] },
                                                },
                                            },
                                            0,
                                        ],
                                    },
                                },
                                in: {
                                    $mergeObjects: [
                                        '$$d',
                                        {
                                            assetModelSparePart: {
                                                $mergeObjects: [
                                                    '$$amsp',
                                                    {
                                                        sparePart: {
                                                            $arrayElemAt: [
                                                                {
                                                                    $filter: {
                                                                        input: '$spareParts',
                                                                        as: 'sp',
                                                                        cond: { $eq: ['$$sp._id', '$$amsp.sparePart'] },
                                                                    },
                                                                },
                                                                0,
                                                            ],
                                                        },
                                                    },
                                                ],
                                            },
                                        },
                                    ],
                                },
                            },
                        },
                    },
                },
            },
        },

        { $project: { assetModelSpareParts: 0 } },

        // paginate
        {
            $facet: {
                data: [{ $skip: skip }, { $limit: limit }],
                total: [{ $count: 'count' }],
            },
        },
    ];

    const result = await BreakdownSpareRequest.aggregate(pipeline);

    const data = result[0].data;
    const totalRecords = result[0].total[0]?.count || 0;

    return {
        data,
        page,
        limit,
        totalRecords,
        totalPages: Math.ceil(totalRecords / limit),
    };
};

const getAllBreakdownSpareRequestBySpareRequestId = async (id) => {
    const details = await BreakdownSpareRequestDetail.find({ breakdownSpareRequest: id })
        .populate({ path: 'assetModelSparePart' })
        .populate({
            path: 'breakdownSpareRequest',
            select: 'createdBy',
            populate: {
                path: 'createdBy',
                select: 'fullName',
            },
        });

    const detailsWithSparePart = await Promise.all(
        details.map(async (detail) => {
            const sparePartId = detail.assetModelSparePart.sparePart;
            const sparePart = sparePartId ? await sparePartsService.getSparePartById(sparePartId) : null;

            return {
                ...detail.toJSON(),
                sparePart,
            };
        })
    );

    return detailsWithSparePart;
};

const getAllBreakdownSpareRequest = async () => {
    const breakdownSpareRequests = await BreakdownSpareRequest.find()
        .populate({ path: 'assetModelSparePart' })
        .populate({ path: 'breakdown' });

    return breakdownSpareRequests;
};

const updateData = async (id, data) => {
    const { spareRequest, spareRequestDetail } = data;

    const breakdownSpareRequest = await BreakdownSpareRequest.findByIdAndUpdate(id, { ...spareRequest });

    await BreakdownSpareRequestDetail.deleteMany({ breakdownSpareRequest: id });

    const dataToInsert = spareRequestDetail.map((item) => ({
        ...item,
        breakdownSpareRequest: id,
    }));

    const insertBreakSparePart = await BreakdownSpareRequestDetail.insertMany(dataToInsert);

    // Cập nhật trạng thái của BreakdownAssignUserModel theo requestStatus
    let assignStatus = null;

    if (spareRequest.requestStatus.toString() === breakdownSpareRequestStatus.rejected.toString()) {
        assignStatus = breakdownAssignUserStatus.inProgress; //
    } else {
        assignStatus = spareRequest.requestStatus;
    }

    const assignUser = await BreakdownAssignUserModel.findOneAndUpdate(
        { breakdown: spareRequest.breakdown },
        { $set: { status: assignStatus } },
        { sort: { updatedAt: -1 }, new: true }
    );
    if (!assignUser) throw new Error('Không tìm thấy BreakdownAssignUser');

    const latestCheckInCheckOut = await breakdownAssignUserService.getLatestBreakdownAssignUserCheckInCheckOut({
        breakdownAssignUser: assignUser._id,
    });

    if (!latestCheckInCheckOut) {
        throw new Error('AssetIdInfo not found');
    }

    if (latestCheckInCheckOut && !latestCheckInCheckOut.logOutAt) {
        const payloadUpdate = {
            logOutAt: new Date(),
            checkOutComments: 'gửi yêu cầu sparePart',
        };
        await breakdownAssignUserService.updateBreakdownAssignUserCheckInCheckOut(latestCheckInCheckOut.id, payloadUpdate);
    }
    return { breakdownSpareRequest, insertBreakSparePart };
};

const getBreakdownSparePartResByRes = async (data) => {
    const breakdownSparePartResquests = await BreakdownSpareRequest.find(data)
        .populate([
            {
                path: 'createdBy',
            },
        ])
        .sort({ createdAt: -1 });
    return breakdownSparePartResquests;
};
const approveBreakdownSpareRequest = async (data) => {
    const { breakdownSpareRequestId, breakdownSpareRequestDetails, userId } = data;
    const breakdownSpareRequest = await BreakdownSpareRequest.findById(breakdownSpareRequestId);
    if (!breakdownSpareRequest) {
        throw new Error('breakdownSpareRequest not found');
    }
    if (breakdownSpareRequest.requestStatus === breakdownSpareRequestStatus.submitted) {
        throw new Error('Phụ tùng đã được gửi tới');
    }
    // if (breakdownSpareRequest.requestStatus === breakdownSpareRequestStatus.approved) {
    //     throw new Error('Phụ tùng đã được duyệt');
    // }
    if (breakdownSpareRequest.requestStatus === breakdownSpareRequestStatus.spareReplace) {
        throw new Error('Phụ tùng đã thay thế');
    }
    // cập nhật detail được rejected
    if (breakdownSpareRequestDetails && breakdownSpareRequestDetails.length > 0) {
        for (let index = 0; index < breakdownSpareRequestDetails.length; index++) {
            const element = breakdownSpareRequestDetails[index];
            if (element.requestStatus === breakdownSpareRequestDetailStatus.spareReplace) {
                continue;
            }
            await BreakdownSpareRequestDetail.findByIdAndUpdate(element.id, {
                requestStatus: element.requestStatus,
                qty: element.qty,
                unitCost: element.unitCost,
            });
        }
    }
    // cập nhật trạng thái lên
    const details = await BreakdownSpareRequestDetail.find({
        breakdownSpareRequest: breakdownSpareRequestId,
        requestStatus: {
            $nin: [breakdownSpareRequestDetailStatus.rejected, breakdownSpareRequestDetailStatus.spareReplace],
        },
    });
    // tất cả detail đều là rejected
    if (details.length === 0) {
        await BreakdownSpareRequest.findByIdAndUpdate(breakdownSpareRequestId, {
            requestStatus: breakdownSpareRequestStatus.rejected,
            assignUserDate: new Date(),
        });

        // cập nhập trạng thái của breakdown
        console.log(breakdownSpareRequest.breakdown, userId);
        // await breakdownService.updateBreakdownById(breakdownSpareRequest.breakdown, { status: breakdownAssignUserStatus.inProgress });

        const test = await BreakdownAssignUserModel.findOneAndUpdate(
            { user: userId, breakdown: breakdownSpareRequest.breakdown },
            {
                $set: { status: breakdownAssignUserStatus.inProgress },
            }
        );

        console.log(test);
    } else {
        // cập nhập trạng thái của breakdownspareRequest
        await BreakdownSpareRequest.findByIdAndUpdate(breakdownSpareRequestId, {
            requestStatus: nextRequestStatus(breakdownSpareRequest.requestStatus),
            assignUserDate: new Date(),
        });
        const detailIds = details.map((item) => item._id);
        await BreakdownSpareRequestDetail.updateMany(
            { _id: { $in: detailIds } },
            {
                requestStatus: nextRequestStatus(breakdownSpareRequest.requestStatus),
            }
        );

        // asign lại user
        if (data.userIds && data.userIds.length > 0) {
            // đăng xuất người gửi yêu cầu nếu đang đăng nhập
            const assignUser = await BreakdownAssignUserModel.findOneAndUpdate(
                { breakdown: breakdownSpareRequest.breakdown, user: breakdownSpareRequest.createdBy },
                null,
                { sort: { updatedAt: -1 }, new: true }
            );
            if (!assignUser) throw new Error('Không tìm thấy BreakdownAssignUser');
            const latestCheckInCheckOut = await breakdownAssignUserService.getLatestBreakdownAssignUserCheckInCheckOut({
                breakdownAssignUser: assignUser._id,
            });
            if (!latestCheckInCheckOut) {
                throw new Error('AssetIdInfo not found');
            }
            const payloadUpdate = {
                logOutAt: new Date(),
                checkOutComments: 'gửi yêu cầu sparePart',
            };
            await breakdownAssignUserService.updateBreakdownAssignUserCheckInCheckOut(
                latestCheckInCheckOut.id,
                payloadUpdate
            );
            // kiểm tra người đc assign đã tham gia vào sự cố hay chưa
            const findCreatedByIdx = data.userIds.findIndex(
                (u) => u.toString() === breakdownSpareRequest.createdBy.toString()
            );
            if (findCreatedByIdx > -1) {
                // cập nhập trạng thái của breackdownAssignUser nếu có người thay
                await BreakdownAssignUserModel.findOneAndUpdate(
                    { user: breakdownSpareRequest.createdBy, breakdown: breakdownSpareRequest.breakdown },
                    {
                        $set: { status: breakdownAssignUserStatus.submitted },
                    }
                );
            } else {
                const assignUserFromCreateBy = await BreakdownAssignUserModel.findOneAndUpdate(
                    { user: breakdownSpareRequest.createdBy, breakdown: breakdownSpareRequest.breakdown },
                    {
                        $set: { status: breakdownAssignUserStatus.replacement },
                    }
                );
                const lastCheckInCheckOut = await breakdownAssignUserService.getLatestBreakdownAssignUserCheckInCheckOut({
                    breakdownAssignUser: assignUserFromCreateBy._id,
                });
                if (lastCheckInCheckOut && !lastCheckInCheckOut.logOutAt) {
                    await breakdownAssignUserService.updateBreakdownAssignUserCheckInCheckOut(assignUserFromCreateBy._id, {
                        logOutAt: new Date(),
                    });
                }
            }
            const breakdownAssignUserStatusReopen = [
                breakdownAssignUserStatus.replacement,
                breakdownAssignUserStatus.rejected,
            ];
            for (let index = 0; index < data.userIds.length; index++) {
                const userId = data.userIds[index];
                await BreakdownSpareRequestAssignUserModel.create({
                    breakdownSpareRequest: breakdownSpareRequestId,
                    user: userId,
                });
                const existingAssignUser = await BreakdownAssignUserModel.findOne({
                    breakdown: breakdownSpareRequest.breakdown,
                    user: userId,
                });
                // nếu chưa tham gia thì tạo mới assign user
                if (!existingAssignUser) {
                    await BreakdownAssignUserModel.create({
                        breakdown: breakdownSpareRequest.breakdown,
                        user: userId,
                        repairContract: assignUser?.repairContract ? assignUser?.repairContract : null,
                    });
                } else if (breakdownAssignUserStatusReopen.includes(existingAssignUser.status)) {
                    await BreakdownAssignUserModel.updateOne(
                        { breakdown: breakdownSpareRequest.breakdown, user: userId },
                        {
                            status: breakdownAssignUserStatus.assigned,
                            repairContract: assignUser?.repairContract ? assignUser?.repairContract : null,
                        }
                    );
                }
            }
            await breakdownService.updateBreakdownById(breakdownSpareRequest.breakdown, {
                status: breakdownAssignUserStatus.submitted,
            });
        } else {
            await BreakdownAssignUserModel.findOneAndUpdate(
                { user: breakdownSpareRequest.createdBy, breakdown: breakdownSpareRequest.breakdown },
                {
                    $set: { status: breakdownAssignUserStatus.submitted },
                }
            );
        }
    }
    return breakdownSpareRequest;
};
const breakdownSpareRequestAssignUserBybreakdownSpareRequest = async (data) => {
    const breakdownSpareRequestAssignUserBybreakdownSpareRequests = await BreakdownSpareRequestAssignUserModel.find(
        data
    ).populate({
        path: 'user',
    });
    return breakdownSpareRequestAssignUserBybreakdownSpareRequests;
};

const getSparePartMovemen = async ({
    spareCategoryId,
    spareSubCategoryId,
    sparePart,
    startDate,
    endDate,
    page = 1,
    limit = 10,
    req,
}) => {
    // const spareCategoryIds = spareCategoryId?.length > 0
    //     ? spareCategoryId.split(',').filter(Boolean).map(id => new mongoose.Types.ObjectId(id))
    //     : [];

    // const spareSubCategoryIds = spareSubCategoryId?.length > 0
    //     ? spareSubCategoryId.split(',').filter(Boolean).map(id => new mongoose.Types.ObjectId(id))
    //     : [];

    // const sparePartIds = sparePart?.length > 0
    //     ? sparePart.split(',').filter(Boolean).map(id => new mongoose.Types.ObjectId(id))
    //     : [];
    const spareCategoryIds =
        spareCategoryId && Array.isArray(spareCategoryId)
            ? spareCategoryId.filter(Boolean).map((id) => new mongoose.Types.ObjectId(id))
            : [];
    const spareSubCategoryIds =
        spareSubCategoryId && Array.isArray(spareSubCategoryId)
            ? spareSubCategoryId.filter(Boolean).map((id) => new mongoose.Types.ObjectId(id))
            : [];
    const sparePartIds =
        sparePart && Array.isArray(sparePart) ? sparePart.filter(Boolean).map((id) => new mongoose.Types.ObjectId(id)) : [];

    const filterSpare = {
        ...(spareCategoryIds.length && { 'spareCategory._id': { $in: spareCategoryIds } }),
        ...(spareSubCategoryIds.length && { 'spareSubCategory._id': { $in: spareSubCategoryIds } }),
        ...(sparePartIds.length && { 'sparePart._id': { $in: sparePartIds } }),
    };
    const filterMatch = {};
    // kiểm tra xem có được xem tất cả tài sản không
    let allowViewAll = true;
    if (req.companySetting.filterByAccount) {
        const dep = await Department.findById(req.user.department).select('allowViewAll');
        allowViewAll = dep?.allowViewAll;
    }
    const amQuery = {};
    if (req.body.branchs && Array.isArray(req.body.branchs) && req.body.branchs.length > 0) {
        amQuery.branch = { $in: req.body.branchs.map((id) => mongoose.Types.ObjectId(id)) };
    }
    if (!allowViewAll) {
        amQuery.department = mongoose.Types.ObjectId(req?.user?.department);
    }

    if (Object.keys(amQuery).length > 0) {
        const validAssetMaintenances = await AssetMaintenance.find(amQuery).select('_id');
        const amIds = validAssetMaintenances.map((asset) => asset._id);
        const validBreakdown = await Breakdown.find({ assetMaintenance: { $in: amIds } });
        const breakdownIds = validBreakdown.map((b) => b._id);
        const validBreakdownSpareRequest = await BreakdownSpareRequest.find({ breakdown: { $in: breakdownIds } });
        const breakdownSpareRequestIds = validBreakdownSpareRequest.map((b) => b._id);
        filterMatch.breakdownSpareRequest = { $in: breakdownSpareRequestIds };
    }

    const pipeline = [
        {
            $lookup: {
                from: 'breakdownsparerequests',
                localField: 'breakdownSpareRequest',
                foreignField: '_id',
                as: 'request',
            },
        },
        { $unwind: '$request' },

        {
            $match: {
                requestStatus: { $in: ['submitted', 'spareReplace'] },
                ...filterMatch,
            },
        },

        {
            $lookup: {
                from: 'assetmodelspareparts',
                localField: 'assetModelSparePart',
                foreignField: '_id',
                as: 'assetModelSparePart',
            },
        },
        { $unwind: '$assetModelSparePart' },

        {
            $addFields: {
                sparePart: '$assetModelSparePart.sparePart',
                assignUserDate: '$request.assignUserDate',
            },
        },

        ...(startDate || endDate
            ? [
                  {
                      $match: {
                          assignUserDate: {
                              ...(startDate && { $gte: startDate }),
                              ...(endDate && { $lte: endDate }),
                          },
                      },
                  },
              ]
            : []),

        {
            $project: {
                qty: 1,
                sparePart: 1,
                assignUserDate: 1,
            },
        },

        {
            $unionWith: {
                coll: 'scheduleprevetivetasksparepartrequestdetails',
                pipeline: [
                    {
                        $lookup: {
                            from: 'scheduleprevetivetasksparepartrequests',
                            localField: 'schedulePrevetiveTaskSparePartRequest',
                            foreignField: '_id',
                            as: 'request',
                        },
                    },
                    { $unwind: '$request' },

                    {
                        $match: {
                            requestStatus: { $in: ['submitted', 'spareReplace'] },
                        },
                    },

                    {
                        $addFields: {
                            assignUserDate: '$request.assignUserDate',
                        },
                    },

                    ...(startDate || endDate
                        ? [
                              {
                                  $match: {
                                      assignUserDate: {
                                          ...(startDate && { $gte: startDate }),
                                          ...(endDate && { $lte: endDate }),
                                      },
                                  },
                              },
                          ]
                        : []),

                    {
                        $project: {
                            qty: 1,
                            sparePart: 1,
                            assignUserDate: 1,
                        },
                    },
                ],
            },
        },

        {
            $lookup: {
                from: 'spareparts',
                localField: 'sparePart',
                foreignField: '_id',
                as: 'sparePart',
            },
        },
        { $unwind: '$sparePart' },

        {
            $lookup: {
                from: 'sparecategories',
                localField: 'sparePart.spareCategoryId',
                foreignField: '_id',
                as: 'spareCategory',
            },
        },
        { $unwind: { path: '$spareCategory', preserveNullAndEmptyArrays: true } },

        {
            $lookup: {
                from: 'sparesubcategories',
                localField: 'sparePart.spareSubCategoryId',
                foreignField: '_id',
                as: 'spareSubCategory',
            },
        },
        { $unwind: { path: '$spareSubCategory', preserveNullAndEmptyArrays: true } },

        {
            $lookup: {
                from: 'manufacturers',
                localField: 'sparePart.manufacturer',
                foreignField: '_id',
                as: 'manufacturer',
            },
        },
        { $unwind: { path: '$manufacturer', preserveNullAndEmptyArrays: true } },

        {
            $lookup: {
                from: 'uoms',
                localField: 'sparePart.uomId',
                foreignField: '_id',
                as: 'uom',
            },
        },
        { $unwind: { path: '$uom', preserveNullAndEmptyArrays: true } },

        {
            $match: filterSpare,
        },

        {
            $project: {
                qty: 1,
                assignUserDate: 1,
                'sparePart.code': 1,
                'sparePart.sparePartsName': 1,
                'sparePart.description': 1,
                'spareCategory._id': 1,
                'spareCategory.spareCategoryName': 1,
                'spareSubCategory._id': 1,
                'spareSubCategory.spareSubCategoryName': 1,
                'manufacturer._id': 1,
                'manufacturer.manufacturerName': 1,
                'uom._id': 1,
                'uom.uomName': 1,
            },
        },

        { $sort: { assignUserDate: -1 } },

        {
            $facet: {
                data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
                total: [{ $count: 'count' }],
            },
        },
    ];

    const result = await BreakdownSpareRequestDetail.aggregate(pipeline);

    return {
        data: result[0]?.data || [],
        total: result[0]?.total[0]?.count || 0,
        page,
        limit,
    };
};
const getSparePartsUsageSummary = async ({
    spareCategoryId,
    spareSubCategoryId,
    sparePart,
    startDate,
    endDate,
    page = 1,
    limit = 10,
    req,
}) => {
    // const spareCategoryIds = spareCategoryId?.length > 0
    //     ? spareCategoryId.split(',').filter(Boolean).map(id => new mongoose.Types.ObjectId(id))
    //     : [];

    // const spareSubCategoryIds = spareSubCategoryId?.length > 0
    //     ? spareSubCategoryId.split(',').filter(Boolean).map(id => new mongoose.Types.ObjectId(id))
    //     : [];

    // const sparePartIds = sparePart?.length > 0
    //     ? sparePart.split(',').filter(Boolean).map(id => new mongoose.Types.ObjectId(id))
    //     : [];
    const spareCategoryIds =
        spareCategoryId && Array.isArray(spareCategoryId)
            ? spareCategoryId.filter(Boolean).map((id) => new mongoose.Types.ObjectId(id))
            : [];
    const spareSubCategoryIds =
        spareSubCategoryId && Array.isArray(spareSubCategoryId)
            ? spareSubCategoryId.filter(Boolean).map((id) => new mongoose.Types.ObjectId(id))
            : [];
    const sparePartIds =
        sparePart && Array.isArray(sparePart) ? sparePart.filter(Boolean).map((id) => new mongoose.Types.ObjectId(id)) : [];

    const filterSpare = {
        ...(spareCategoryIds.length && { 'spareCategory._id': { $in: spareCategoryIds } }),
        ...(spareSubCategoryIds.length && { 'spareSubCategory._id': { $in: spareSubCategoryIds } }),
        ...(sparePartIds.length && { 'sparePart._id': { $in: sparePartIds } }),
    };
    const filterMatch = {};
    // kiểm tra xem có được xem tất cả tài sản không
    let allowViewAll = true;
    if (req.companySetting.filterByAccount) {
        const dep = await Department.findById(req.user.department).select('allowViewAll');
        allowViewAll = dep?.allowViewAll;
    }
    const amQuery = {};
    if (req.body.branchs && Array.isArray(req.body.branchs) && req.body.branchs.length > 0) {
        amQuery.branch = { $in: req.body.branchs.map((id) => mongoose.Types.ObjectId(id)) };
    }
    if (!allowViewAll) {
        amQuery.department = mongoose.Types.ObjectId(req?.user?.department);
    }

    if (Object.keys(amQuery).length > 0) {
        const validAssetMaintenances = await AssetMaintenance.find(amQuery).select('_id');
        const amIds = validAssetMaintenances.map((asset) => asset._id);
        const validBreakdown = await Breakdown.find({ assetMaintenance: { $in: amIds } });
        const breakdownIds = validBreakdown.map((b) => b._id);
        const validBreakdownSpareRequest = await BreakdownSpareRequest.find({ breakdown: { $in: breakdownIds } });
        const breakdownSpareRequestIds = validBreakdownSpareRequest.map((b) => b._id);
        filterMatch.breakdownSpareRequest = { $in: breakdownSpareRequestIds };
    }

    const pipeline = [
        {
            $match: {
                requestStatus: { $in: ['submitted', 'spareReplace'] },
                ...filterMatch,
            },
        },

        {
            $lookup: {
                from: 'breakdownsparerequests',
                localField: 'breakdownSpareRequest',
                foreignField: '_id',
                as: 'request',
            },
        },
        { $unwind: '$request' },

        {
            $lookup: {
                from: 'assetmodelspareparts',
                localField: 'assetModelSparePart',
                foreignField: '_id',
                as: 'assetModelSparePart',
            },
        },
        { $unwind: '$assetModelSparePart' },

        {
            $addFields: {
                sparePart: '$assetModelSparePart.sparePart',
                assignUserDate: '$request.assignUserDate',
            },
        },

        ...(startDate || endDate
            ? [
                  {
                      $match: {
                          assignUserDate: {
                              ...(startDate && { $gte: startDate }),
                              ...(endDate && { $lte: endDate }),
                          },
                      },
                  },
              ]
            : []),

        {
            $project: {
                sparePart: 1,
                qty: 1,
            },
        },

        {
            $unionWith: {
                coll: 'scheduleprevetivetasksparepartrequestdetails',
                pipeline: [
                    {
                        $match: {
                            requestStatus: { $in: ['submitted', 'spareReplace'] },
                        },
                    },
                    {
                        $lookup: {
                            from: 'scheduleprevetivetasksparepartrequests',
                            localField: 'schedulePrevetiveTaskSparePartRequest',
                            foreignField: '_id',
                            as: 'request',
                        },
                    },
                    { $unwind: '$request' },

                    {
                        $addFields: {
                            assignUserDate: '$request.assignUserDate',
                        },
                    },

                    ...(startDate || endDate
                        ? [
                              {
                                  $match: {
                                      assignUserDate: {
                                          ...(startDate && { $gte: startDate }),
                                          ...(endDate && { $lte: endDate }),
                                      },
                                  },
                              },
                          ]
                        : []),

                    {
                        $project: {
                            sparePart: 1,
                            qty: 1,
                        },
                    },
                ],
            },
        },

        {
            $lookup: {
                from: 'spareparts',
                localField: 'sparePart',
                foreignField: '_id',
                as: 'sparePart',
            },
        },
        { $unwind: '$sparePart' },

        {
            $lookup: {
                from: 'sparecategories',
                localField: 'sparePart.spareCategoryId',
                foreignField: '_id',
                as: 'spareCategory',
            },
        },
        { $unwind: { path: '$spareCategory', preserveNullAndEmptyArrays: true } },

        {
            $lookup: {
                from: 'sparesubcategories',
                localField: 'sparePart.spareSubCategoryId',
                foreignField: '_id',
                as: 'spareSubCategory',
            },
        },
        { $unwind: { path: '$spareSubCategory', preserveNullAndEmptyArrays: true } },

        {
            $lookup: {
                from: 'manufacturers',
                localField: 'sparePart.manufacturer',
                foreignField: '_id',
                as: 'manufacturer',
            },
        },
        { $unwind: { path: '$manufacturer', preserveNullAndEmptyArrays: true } },

        {
            $lookup: {
                from: 'uoms',
                localField: 'sparePart.uomId',
                foreignField: '_id',
                as: 'uom',
            },
        },
        { $unwind: { path: '$uom', preserveNullAndEmptyArrays: true } },

        {
            $match: filterSpare,
        },

        {
            $group: {
                _id: '$sparePart._id',
                qty: { $sum: '$qty' },
                sparePart: { $first: '$sparePart' },
                spareCategory: { $first: '$spareCategory' },
                spareSubCategory: { $first: '$spareSubCategory' },
                manufacturer: { $first: '$manufacturer' },
                uom: { $first: '$uom' },
            },
        },

        { $sort: { qty: -1 } },

        {
            $facet: {
                data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
                total: [{ $count: 'count' }],
            },
        },
    ];

    const result = await BreakdownSpareRequestDetail.aggregate(pipeline);

    return {
        data: result[0].data,
        total: result[0].total[0]?.count || 0,
        page,
        limit,
    };
};
const getBreakdownSpareRequestDetails = async (breakdownSpareRequestId) => {
    return BreakdownSpareRequestDetail.find({
        breakdownSpareRequest: breakdownSpareRequestId,
    })
        .populate({
            path: 'assetModelSparePart',
            populate: {
                path: 'sparePart',
                select: 'sparePartsName',
            },
        })
        .populate({
            path: 'breakdownSpareRequest',
            select: 'createdBy',
            populate: {
                path: 'createdBy',
                select: 'fullName',
            },
        })
        .lean();
};

const getLastDocStatusApproved = async (breakdown) => {
    const doc = await BreakdownSpareRequest.findOne({
        requestStatus: [breakdownSpareRequestStatus.approved, breakdownSpareRequestStatus.pendingApproval],
        breakdown: breakdown,
    });
    return doc;
};

const appendSpareRequestDetails = async (breakdownSpareRequestId, details) => {
    const docs = details.map((item) => ({
        ...item,
        breakdownSpareRequest: breakdownSpareRequestId,
    }));

    return BreakdownSpareRequestDetail.insertMany(docs);
};

module.exports = {
    createBreakdownSpareRequest,
    queryBreakdownSpareRequests,
    deleteBreakdownSpareRequest,
    findBreakdownSpareRequestById,
    updateBreakdownSpareRequest,
    queryBreakdownSpareRequestByBreakdown,
    getAllBreakdownSpareRequest,
    getAllBreakdownSpareRequestBySpareRequestId,
    updateData,
    getBreakdownSparePartResByRes, // truong viết đế lấy pou
    approveBreakdownSpareRequest,
    breakdownSpareRequestAssignUserBybreakdownSpareRequest,
    getSparePartMovemen,
    getSparePartsUsageSummary,
    updateBreakdownSpareRequestDetail,
    getBreakdownSpareRequestDetails,
    getLastDocStatusApproved,
    appendSpareRequestDetails,
};
