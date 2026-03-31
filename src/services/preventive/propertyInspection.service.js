const httpStatus = require('http-status');
const mongoose = require('mongoose');
const {
    PropertyInspectionModel,
    PropertyInspectionTaskModel,
    Breakdown,
    AssetMaintenance,
    AssetMaintenanceUserModel,
    PropertyInspectionAttachmentModel,
    Resource,
    Department,
} = require('../../models');
const ApiError = require('../../utils/ApiError');
const { propertyInspectionStatus, progressStatus, notificationTypeCode } = require('../../utils/constant');
const sequenceService = require('../common/sequence.service');
const breakdownService = require('../common/breakdown.service');
const notificationService = require('../notification/notification.service');
const assetMaintenanceService = require('../common/assetMaintenance.service');

const createPropertyInspection = async (
    checklistItems,
    assetMaintenance,
    checkboxBreakdown,
    breakdownDescription,
    priorityLevel,
    note,
    nameUser,
    listDocuments,
    createdBy
) => {
    if (!assetMaintenance) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Asset Maintenance is required');
    }

    if (checklistItems.length === 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Checklist items is required');
    }
    const _assetMaintenance = await AssetMaintenance.findById(assetMaintenance);
    await assetMaintenanceService.checkAssetMaintenanceNotWithAssetStatus(_assetMaintenance?._id);
    const data = {
        assetMaintenance,
        note,
        nameUser,
        inspectionDate: new Date(),
        code: await sequenceService.generateSequenceCode('PROPERTY_INSPECTION'),
        province: _assetMaintenance?.province,
        commune: _assetMaintenance?.commune,
        branch: _assetMaintenance?.branch,
        building: _assetMaintenance?.building,
        floor: _assetMaintenance?.floor,
        department: _assetMaintenance?.department,
        addressNote: _assetMaintenance?.addressNote,
    };
    if (createdBy) {
        data.createdBy = createdBy;
    }
    if (checkboxBreakdown && checkboxBreakdown === true) {
        data.status = propertyInspectionStatus.partiallyCompleted;
    } else {
        data.status = propertyInspectionStatus.waitingForAdminApproval;
    }
    const create = await PropertyInspectionModel.create(data);
    // kiểm tra tạo breakdown
    if (checkboxBreakdown && checkboxBreakdown === true) {
        const data = {
            assetMaintenance,
            defectDescription: breakdownDescription,
            priorityLevel,
            code: await sequenceService.generateSequenceCode('BREAKDOWN_TIKET'),
            propertyInspection: create._id || create.id,
            province: _assetMaintenance?.province,
            commune: _assetMaintenance?.commune,
            branch: _assetMaintenance?.branch,
            building: _assetMaintenance?.building,
            floor: _assetMaintenance?.floor,
            department: _assetMaintenance?.department,
            addressNote: _assetMaintenance?.addressNote,
        };
        const breakdown = await Breakdown.create(data);
        const payloadHistory = {
            workedDate: Date.now(),
            status: progressStatus.raised,
            breakdown: breakdown._id,
        };
        await breakdownService.createBreakdownHistory(payloadHistory);
    }
    // tạo các task
    for (const item of checklistItems) {
        if (!item.content) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Content is required');
        }
        await PropertyInspectionTaskModel.create({
            content: item.content,
            index: item.index,
            status: item.status,
            propertyInspection: create._id || create.id,
        });
    }
    if (create) {
        const assetMaintenanceById = await AssetMaintenance.findById(assetMaintenance).populate({
            path: 'asset',
        });
        const assetMaintenanceUsers = await AssetMaintenanceUserModel.find({
            assetMaintenance: assetMaintenance,
        });
        if (assetMaintenanceUsers && assetMaintenanceUsers.length > 0) {
            const users = assetMaintenanceUsers.map((item) => item.user);
            const payloadNoti = {
                notificationTypeCode: notificationTypeCode.create_property_inspection,
                text: `Đã tạo mới kiểm tra tài sản ${assetMaintenanceById?.asset?.assetName}. Vui lòng truy cập để theo dõi hoàn thành tiếp công việc kiểm tra`,
                subUrl: `maintenance/property-inspection/view/${create._id}`,
                webSubUrl: `maintenance/property-inspection/view/${create._id}`,
                notificationName: 'Tạo mới kiểm tra tài sản',
                users: users,
            };
            await notificationService.pushNotificationWithUsers(payloadNoti);
        }
    }
    if (listDocuments && listDocuments.length > 0) {
        for (let i = 0; i < listDocuments.length; i++) {
            // eslint-disable-next-line no-await-in-loop
            await PropertyInspectionAttachmentModel.create({
                propertyInspection: create._id,
                resource: listDocuments[i].resource,
            });
        }
    }
    return create;
};

const queryPropertyInspections = async (filter, options, req) => {
    options.sortOrder = options.sortOrder || -1;
    options.sortBy = options.sortBy || 'inspectionDate';
    const queryPropertyInspectionFilter = filter;
    const moreFilter = {};
    // kiểm tra xem có được xem tất cả tài sản không
    let allowViewAll = true;
    if (req.companySetting.filterByAccount) {
        const dep = await Department.findById(req.user.department).select('allowViewAll');
        allowViewAll = dep?.allowViewAll;
    }
    if (!allowViewAll) {
        moreFilter['assetMaintenance.department'] = mongoose.Types.ObjectId(req?.user?.department);
    }
    if (filter.code) {
        queryPropertyInspectionFilter.code = { $regex: filter.code, $options: 'i' };
    }
    if (filter.nameUser) {
        queryPropertyInspectionFilter.nameUser = { $regex: filter.nameUser, $options: 'i' };
    }
    if (filter.assetName) {
        moreFilter['assetMaintenance.assetName'] = {
            $regex: filter.assetName,
            $options: 'i',
        };
        delete filter.assetName;
    }
    if (filter.assetNumber) {
        moreFilter['assetMaintenance.assetNumber'] = {
            $regex: filter.assetNumber,
            $options: 'i',
        };
        delete filter.assetNumber;
    }
    if (filter.assetModelName) {
        moreFilter['assetMaintenance.assetModelName'] = {
            $regex: filter.assetModelName,
            $options: 'i',
        };
        delete filter.assetModelName;
    }
    if (filter.searchText) {
        const text = filter.searchText;
        const regex = { $regex: text, $options: 'i' };
        moreFilter.$or = [
            { code: regex },
            { nameUser: regex },
            { 'assetMaintenance.assetNumber': regex },
            { 'asset.assetName': regex },
            { 'assetModel.assetModelName': regex },
        ];

        delete filter.searchText;
    }
    if (filter.asset) {
        moreFilter['assetMaintenance.assetModel.asset._id'] = mongoose.Types.ObjectId(filter.asset);
        delete filter.asset;
    }
    if (filter.assetModel) {
        moreFilter['assetMaintenance.assetModel._id'] = mongoose.Types.ObjectId(filter.assetModel);
        delete filter.assetModel;
    }
    if (filter.manufacturer) {
        moreFilter['assetMaintenance.assetModel.manufacturer'] = mongoose.Types.ObjectId(filter.manufacturer);
        delete filter.manufacturer;
    }
    if (filter.category) {
        moreFilter['assetMaintenance.assetModel.category'] = mongoose.Types.ObjectId(filter.category);
        delete filter.category;
    }

    if (filter.assetStyle) {
        moreFilter['assetMaintenance.assetStyle'] = filter.assetStyle;
        delete filter.assetStyle;
    }
    // console.log(moreFilter);
    const searchAggregaates = [
        {
            $match: queryPropertyInspectionFilter,
        },
        {
            $lookup: {
                from: 'assetmaintenances',
                localField: 'assetMaintenance',
                foreignField: '_id',
                as: 'assetMaintenance',
                pipeline: [
                    {
                        $lookup: {
                            from: 'assets',
                            localField: 'asset',
                            foreignField: '_id',
                            as: 'asset',
                        },
                    },
                    {
                        $lookup: {
                            from: 'assetmodels',
                            localField: 'assetModel',
                            foreignField: '_id',
                            as: 'assetModel',
                            pipeline: [
                                {
                                    $lookup: {
                                        from: 'assets',
                                        localField: 'asset',
                                        foreignField: '_id',
                                        as: 'asset',
                                    },
                                },
                                { $unwind: { path: '$asset', preserveNullAndEmptyArrays: true } },
                            ],
                        },
                    },
                    {
                        $lookup: {
                            from: 'customers',
                            localField: 'customer',
                            foreignField: '_id',
                            as: 'customer',
                        },
                    },
                    {
                        $lookup: {
                            from: 'branches',
                            localField: 'branch',
                            foreignField: '_id',
                            as: 'branch',
                        },
                    },
                    {
                        $lookup: {
                            from: 'departments',
                            localField: 'department',
                            foreignField: '_id',
                            as: 'department',
                        },
                    },
                    { $unwind: { path: '$department', preserveNullAndEmptyArrays: true } },
                    { $unwind: { path: '$branch', preserveNullAndEmptyArrays: true } },
                    { $unwind: { path: '$asset', preserveNullAndEmptyArrays: true } },
                    { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } },
                    { $unwind: { path: '$assetModel', preserveNullAndEmptyArrays: true } },
                ],
            },
        },
        {
            $lookup: {
                from: 'users',
                localField: 'createdBy',
                foreignField: '_id',
                as: 'createdBy',
            },
        },
        { $unwind: { path: '$assetMaintenance', preserveNullAndEmptyArrays: true } },
        { $unwind: { path: '$createdBy', preserveNullAndEmptyArrays: true } },
        { $match: moreFilter },
    ];
    if (options.sortBy && options.sortOrder) {
        searchAggregaates.push({
            $sort: { [options.sortBy]: options.sortOrder },
        });
    }
    const pagzingAggregaates = [
        {
            $skip: (options.page - 1) * options.limit,
        },
        {
            $limit: options.limit,
        },
    ];
    const propertyInspections = await PropertyInspectionModel.aggregate([...searchAggregaates, ...pagzingAggregaates]);
    const countAggregaates = [
        {
            $count: 'totalResults',
        },
    ];
    const totalResults = await PropertyInspectionModel.aggregate([...searchAggregaates, ...countAggregaates]);
    return { propertyInspections, totalResults: totalResults[0] };
};
const getPropertyInspectionById = async (id) => {
    const propertyInspection = await PropertyInspectionModel.findById(id)
        .populate([
            {
                path: 'assetMaintenance',
                populate: [
                    {
                        path: 'assetModel',
                        populate: [
                            { path: 'manufacturer' },
                            { path: 'subCategory' },
                            { path: 'category' },
                            { path: 'assetTypeCategory' },
                            { path: 'asset' },
                        ],
                    },
                    { path: 'resource' },
                    { path: 'customer' },
                ],
            },
            {
                path: 'createdBy',
            },
        ])
        .lean();
    if (!propertyInspection) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Property Inspection not found');
    }
    const breakdown = await Breakdown.findOne({ propertyInspection: id }).lean();
    propertyInspection.breakdown = breakdown;
    return propertyInspection;
};
const getPropertyInspectionTaskByPropertyInspection = async (propertyInspectionId) => {
    const propertyInspectionTasks = await PropertyInspectionTaskModel.find({ propertyInspection: propertyInspectionId });
    return propertyInspectionTasks;
};
const closePropertyInspection = async (propertyInspectionId) => {
    const propertyInspection = await PropertyInspectionModel.findById(propertyInspectionId);
    if (!propertyInspection) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Property Inspection not found');
    }
    if (propertyInspection && propertyInspection.status !== propertyInspectionStatus.waitingForAdminApproval) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Lỗi trạng thái');
    }
    propertyInspection.status = propertyInspectionStatus.completed;
    propertyInspection.completeDate = new Date();
    await propertyInspection.save();
    return propertyInspection;
};
const cancelPropertyInspection = async (propertyInspectionId) => {
    const propertyInspection = await PropertyInspectionModel.findById(propertyInspectionId);
    if (!propertyInspection) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Property Inspection not found');
    }
    if (propertyInspection && propertyInspection.status === propertyInspectionStatus.completed) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Đang ở trạng thái hoàn thành');
    }
    propertyInspection.status = propertyInspectionStatus.cancelled;
    propertyInspection.cancelDate = new Date();
    await propertyInspection.save();
    return propertyInspection;
};
const getAssetMaintenanceAttachmentByRes = async (data) => {
    const assetMaintenanceAttachments = await PropertyInspectionAttachmentModel.find(data).populate({ path: 'resource' });
    return assetMaintenanceAttachments;
};
const updatePropertyInspectionById = async (propertyInspectionId, updateBody, checklistItems, listDocuments) => {
    const propertyInspection = await PropertyInspectionModel.findById(propertyInspectionId);
    if (!propertyInspection) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Property Inspection not found');
    }
    if (
        propertyInspection.status === propertyInspectionStatus.completed ||
        propertyInspection.status === propertyInspectionStatus.cancelled
    ) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Công việc kiểm tra tài sản này không được phép chỉnh sửa');
    }
    Object.assign(propertyInspection, updateBody);
    await propertyInspection.save();
    // xóa
    await PropertyInspectionTaskModel.deleteMany({ propertyInspection: propertyInspectionId });
    const propertyInspectionAttachments = await PropertyInspectionAttachmentModel.find({
        propertyInspection: propertyInspectionId,
    });
    if (propertyInspectionAttachments.length > 0) {
        const attachmentIds = propertyInspectionAttachments.map((x) => x._id);
        const resourceIds = propertyInspectionAttachments.map((x) => x.resource);
        await PropertyInspectionAttachmentModel.deleteMany({
            _id: { $in: attachmentIds },
        });
        await Resource.deleteMany({
            _id: { $in: resourceIds },
        });
    }
    for (const item of checklistItems) {
        await PropertyInspectionTaskModel.create({
            content: item.content,
            index: item.index,
            status: item.status,
            propertyInspection: propertyInspection._id,
        });
    }
    if (listDocuments && listDocuments.length > 0) {
        for (let i = 0; i < listDocuments.length; i++) {
            // eslint-disable-next-line no-await-in-loop
            await PropertyInspectionAttachmentModel.create({
                propertyInspection: propertyInspection._id,
                resource: listDocuments[i].resource,
            });
        }
    }
    return propertyInspection;
};
module.exports = {
    queryPropertyInspections,
    createPropertyInspection,
    getPropertyInspectionById,
    getPropertyInspectionTaskByPropertyInspection,
    closePropertyInspection,
    cancelPropertyInspection,
    getAssetMaintenanceAttachmentByRes,
    updatePropertyInspectionById,
};
