const httpStatus = require('http-status');
const mongoose = require('mongoose');
const ApiError = require('../../utils/ApiError');
const {
    CalibrationContractModel,
    CalibrationContractAttachmentsModel,
    CalibrationModel,
    CalibrationContractMappingAssetMaintenanceModel,
} = require('../../models');

const createCalibrationContract = async (data, _listResource) => {
    const calibrationContract = await CalibrationContractModel.create(data);
    if (_listResource && _listResource.length > 0) {
        for (let index = 0; index < _listResource.length; index++) {
            const element = _listResource[index];
            element.calibrationContract = calibrationContract._id;
            // eslint-disable-next-line no-await-in-loop
            await CalibrationContractAttachmentsModel.create(element);
        }
    }
    return calibrationContract;
};
const getCalibrationContractById = async (id) => {
    const calibrationContract = CalibrationContractModel.findById(id);
    if (!calibrationContract) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Calibration Contract not found');
    }
    return calibrationContract;
};
// const getCalibrationContracts = async (filter, options) => {
//     const calibrationContracts = await CalibrationContractModel.paginate(filter, {
//         ...options,
//         populate: [{ path: 'customer' }, { path: 'serviceContractor' }],
//     });
//     return calibrationContracts;
// };
const getCalibrationContracts = async (filter, options) => {
    const page = parseInt(options.page) || 1;
    const limit = parseInt(options.limit) || 10;
    const sortBy = options.sortBy || 'createdAt';
    const sortOrder = options.sortOrder || 'desc';
    const sortStage = {};
    sortStage[sortBy] = sortOrder === 'asc' ? 1 : -1;
    const skip = (page - 1) * limit;

    const matchStage = {
        ...(filter.startDate && filter.endDate && {
            expirationDate: {
                $gte: new Date(filter.startDate),
                $lte: new Date(filter.endDate),
            }
        }),
        ...(filter.contractNo && { contractNo: { $regex: filter.contractNo, $options: 'i' } }),
        ...(filter.contractName && { contractName: { $regex: filter.contractName, $options: 'i' } }),
        ...(filter.customer && { customer: mongoose.Types.ObjectId(filter.customer) }),
        ...(filter.serviceContractor && { serviceContractor: mongoose.Types.ObjectId(filter.serviceContractor) }),
    };

    const searchConditions = [];
    if (filter.searchText) {
        searchConditions.push(
            { contractNo: { $regex: filter.searchText, $options: 'i' } },
            { contractName: { $regex: filter.searchText, $options: 'i' } },
            { 'customer.customerName': { $regex: filter.searchText, $options: 'i' } },
            { 'serviceContractor.serviceContractorName': { $regex: filter.searchText, $options: 'i' } },
        );
    }
    if (filter.customerName) {
        searchConditions.push({
            'customer.customerName': { $regex: filter.customerName, $options: 'i' }
        });
    }
    if (filter.serviceContractorName) {
        searchConditions.push({
            'serviceContractor.serviceContractorName': { $regex: filter.serviceContractorName, $options: 'i' }
        });
    }

    const aggregate = [
        {
            $match: matchStage
        },
        {
            $lookup: {
                from: 'servicecontractors',
                localField: 'serviceContractor',
                foreignField: '_id',
                as: 'serviceContractor',
            }
        },
        {
            $lookup: {
                from: 'customers',
                localField: 'customer',
                foreignField: '_id',
                as: 'customer',
            }
        },
        { $unwind: { path: '$serviceContractor', preserveNullAndEmptyArrays: true } },
        { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } },
        ...(searchConditions.length > 0
            ? [{ $match: { $or: searchConditions } }]
            : []),
        { $sort: sortStage },
    ];

    const countAggregates = [
        ...aggregate,
        { $count: 'totalCount' }
    ];
    const fullAggregates = [
        ...aggregate,
        { $skip: skip },
        { $limit: limit },
    ];

    const [calibrationContracts, countCalibrationContracts] = await Promise.all([
        CalibrationContractModel.aggregate(fullAggregates),
        CalibrationContractModel.aggregate(countAggregates),
    ]);

    const totalResults = countCalibrationContracts.length > 0 ? countCalibrationContracts[0].totalCount : 0;
    const totalPages = Math.ceil(totalResults / limit);
    return {
        calibrationContracts,
        page: page,
        limit: limit,
        totalPages: totalPages,
        totalResults: totalResults,
    };
}
const getCalibrationContractAttachmentsByCalibrationContract = async (calibrationContractId) => {
    const calibrationContractAttachments = await CalibrationContractAttachmentsModel.find({
        calibrationContract: calibrationContractId,
    })
        .populate({
            path: 'resource',
            populate: [
                {
                    path: 'createdBy',
                    select: 'fullName'
                }
            ]
        })
        .sort({ createdAt: -1 });
    return calibrationContractAttachments;
};
const updateCalibrationContract = async (id, data, _listResource) => {
    const calibrationContract = await CalibrationContractModel.findById(id);
    if (!calibrationContract) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Calibration Contract not found');
    }
    // xóa và thêm mới lại các file
    await CalibrationContractAttachmentsModel.deleteMany({ calibrationContract: calibrationContract?._id });
    if (_listResource && _listResource.length > 0) {
        for (let index = 0; index < _listResource.length; index++) {
            const element = _listResource[index];
            element.calibrationContract = calibrationContract._id;
            await CalibrationContractAttachmentsModel.create(element);
        }
    }
    Object.assign(calibrationContract, data);
    await calibrationContract.save();
    return calibrationContract;
};
const deleteCalibrationContract = async (id) => {
    const calibrationContract = await CalibrationContractModel.findById(id);
    if (!calibrationContract) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Calibration Contract not found');
    }
    const calibrationByCalibrationContracts = await CalibrationModel.countDocuments({
        calibrationContract: calibrationContract?._id,
    });
    if (calibrationByCalibrationContracts && calibrationByCalibrationContracts > 0) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Hợp đồng này đang được sử dụng trong hiệu chuẩn');
    }
    // xóa và thêm mới lại các file
    await CalibrationContractAttachmentsModel.deleteMany({ calibrationContract: calibrationContract?._id });
    await calibrationContract.remove();
    return calibrationContract;
};
const createCalibrationContractMappingAssetMaintenance = async (data) => {
    if (data && data.assetMaintenance && data.calibrationContract) {
        const calibrationContractMappingAssetMaintenances =
            await CalibrationContractMappingAssetMaintenanceModel.countDocuments({
                assetMaintenance: data.assetMaintenance,
                calibrationContract: data.calibrationContract,
            });
        if (calibrationContractMappingAssetMaintenances && calibrationContractMappingAssetMaintenances > 0) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Hợp đồng này đang được sử dụng trong hiệu chuẩn');
        }
    }
    const create = await CalibrationContractMappingAssetMaintenanceModel.create(data);
    return create;
};
const getCalibrationContractMappingAssetMaintenanceByRes = async (data) => {
    const calibrationContractMappingAssetMaintenances = await CalibrationContractMappingAssetMaintenanceModel.find(data)
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
            { path: 'calibrationContract' },
        ])
        .sort({ createdAt: -1 });
    return calibrationContractMappingAssetMaintenances;
};
const deleteCalibrationContractMappingAssetMaintenance = async (id) => {
    const calibrationContractMappingAssetMaintenance = await CalibrationContractMappingAssetMaintenanceModel.findById(id);
    if (!calibrationContractMappingAssetMaintenance) {
        throw new ApiError(httpStatus.NOT_FOUND, 'CalibrationContract Mapping AssetMaintenance not found');
    }
    await calibrationContractMappingAssetMaintenance.remove();
    return calibrationContractMappingAssetMaintenance;
};
module.exports = {
    createCalibrationContract,
    getCalibrationContractById,
    getCalibrationContracts,
    getCalibrationContractAttachmentsByCalibrationContract,
    updateCalibrationContract,
    deleteCalibrationContract,
    createCalibrationContractMappingAssetMaintenance,
    getCalibrationContractMappingAssetMaintenanceByRes,
    deleteCalibrationContractMappingAssetMaintenance,
};
