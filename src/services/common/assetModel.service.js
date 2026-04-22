const httpStatus = require('http-status');
const mongoose = require('mongoose');
const { AssetModel, AssetModelFailureTypeModel, AssetModelParameterModel } = require('../../models');
const ApiError = require('../../utils/ApiError');


const createAssetModel = async (assetModel) => {
    const a = await AssetModel.create(assetModel)
    // tạo mới mặc định loại hỏng hóc khác
    await AssetModelFailureTypeModel.create({
        assetModel: a._id,
        isDefault: true,
        name: 'Khác'
    })
    return a;
}

const findOne = async (filter) => {
    const assetModel = await AssetModel.findOne(filter);
    return assetModel;
}

const getAssetModelById = async (id) => {
    const a = await AssetModel.findById(id).populate([
        {
            path: 'assetTypeCategory'
        }, {
            path: 'asset'
        },
        {
            path: 'category'
        },
        {
            path: 'manufacturer'
        },
        {
            path: 'subCategory'
        },
        {
            path: 'paramaters'
        },
        { path: 'supplier' },
    ])
    return a;
}
const updateAssetModelById = async (id, assetModel) => {
    const a = await AssetModel.findByIdAndUpdate(id, assetModel)
    return a;
}
const deleteAssetModelById = async (id) => {
    const assetModel = await getAssetModelById(id);
    if (!assetModel) {
        throw new ApiError(httpStatus.NOT_FOUND, 'AssetModel not found');
    }
    await assetModel.remove();
    return assetModel;
}

const updateStatus = async (id, updateBody) => {
    const assetModel = await getAssetModelById(id);
    if (!assetModel) {
        throw new ApiError(httpStatus.NOT_FOUND, 'AssetModel not found');
    }
    Object.assign(assetModel, updateBody);
    await assetModel.save();
    return assetModel;
};

const getAllAssetModel = async () => {
    const assetModel = await AssetModel.find().populate([{ path: 'asset' }]);
    return assetModel;
}

const getAssetModelByAssetId = async (assetId) => {
    const assetModel = await AssetModel.find({ assetId })

    return assetModel;
}

const getAssetModelParameters = async (assetModelId) => {
    const assetModelParameters = await AssetModelParameterModel.find({ assetModel: assetModelId })
    return assetModelParameters;
}

const queryAssetModel = async (filter, options) => {
    ['assetTypeCategory', 'supplier', 'category', 'manufacturer', 'subCategory', '_id', 'asset'].forEach((key) => {
        if (filter[key] && typeof filter[key] === 'string' && mongoose.Types.ObjectId.isValid(filter[key])) {
            // eslint-disable-next-line no-param-reassign
            filter[key] = mongoose.Types.ObjectId(filter[key]);
        }
    });
    const _populate = [{
        path: 'assetTypeCategory'
    },
    {
        path: 'category'
    },
    {
        path: 'manufacturer'
    },
    {
        path: 'subCategory'
    },
    {
        path: 'paramaters'
    },
    {
        path: 'supplier'
    },
    {
        path: 'asset'
    },];
    const assetModels = await AssetModel.paginate(filter, {
        ...options,
        populate: _populate,
    });
    return assetModels;
};

const getAssetModelByAssetTypeAndAsset = async (filter, options) => {
    ["asset", 'category', 'manufacturer', 'subCategory', '_id', 'supplier'].forEach((key) => {
        if (filter[key] && typeof filter[key] === 'string' && mongoose.Types.ObjectId.isValid(filter[key])) {
            // eslint-disable-next-line no-param-reassign
            filter[key] = mongoose.Types.ObjectId(filter[key]);
        }
    });
    // eslint-disable-next-line no-param-reassign
    filter.assetTypeCategory = null;
    const _populate = [
        { path: 'category' },
        { path: 'manufacturer' },
        { path: 'subCategory' },
        { path: 'supplier' }
    ];
    const assetModels = await AssetModel.paginate(filter, {
        ...options,
        populate: _populate,
    });
    return assetModels;
};
const queryAssetModelStock = async (filter, options) => {
    ['assetTypeCategory', 'supplier', 'category', 'manufacturer', 'subCategory', '_id', 'asset'].forEach((key) => {
        if (filter[key] && typeof filter[key] === 'string' && mongoose.Types.ObjectId.isValid(filter[key])) {
            filter[key] = mongoose.Types.ObjectId(filter[key]);
        }
    });

    const page = Math.max(parseInt(options.page, 10) || 1, 1);
    const limit = Math.max(parseInt(options.limit, 10) || 10, 1);
    const skip = (page - 1) * limit;

    const VIRTUAL_ID = mongoose.Types.ObjectId("69df9eebbb8e09ee7c6d803b");

    const pipeline = [
        { $match: filter },

        // ===== STOCK =====
        {
            $lookup: {
                from: 'stockmovelines',
                let: { assetModelId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$assetModel', '$$assetModelId'] },
                                    { $eq: ['$itemType', 'AssetModel'] }
                                ]
                            }
                        }
                    },
                    {
                        $group: {
                            _id: null,

                            // vào kho VIRTUAL
                            inQty: {
                                $sum: {
                                    $cond: [
                                        { $eq: ['$locationDest', VIRTUAL_ID] },
                                        '$productDoneQty',
                                        0
                                    ]
                                }
                            },

                            // ra khỏi kho VIRTUAL
                            outQty: {
                                $sum: {
                                    $cond: [
                                        { $eq: ['$location', VIRTUAL_ID] },
                                        '$productDoneQty',
                                        0
                                    ]
                                }
                            }
                        }
                    }
                ],
                as: 'stockData'
            }
        },

        {
            $addFields: {
                stockQty: {
                    $subtract: [
                        { $ifNull: [{ $arrayElemAt: ['$stockData.inQty', 0] }, 0] },
                        { $ifNull: [{ $arrayElemAt: ['$stockData.outQty', 0] }, 0] }
                    ]
                }
            }
        },

        // ===== FILTER > 0 =====
        {
            $match: {
                stockQty: { $gt: 0 }
            }
        },

        // ===== POPULATE (convert sang lookup) =====
        { $lookup: { from: 'assettypecategories', localField: 'assetTypeCategory', foreignField: '_id', as: 'assetTypeCategory' } },
        { $unwind: { path: '$assetTypeCategory', preserveNullAndEmptyArrays: true } },

        { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'category' } },
        { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },

        { $lookup: { from: 'manufacturers', localField: 'manufacturer', foreignField: '_id', as: 'manufacturer' } },
        { $unwind: { path: '$manufacturer', preserveNullAndEmptyArrays: true } },

        { $lookup: { from: 'subcategories', localField: 'subCategory', foreignField: '_id', as: 'subCategory' } },
        { $unwind: { path: '$subCategory', preserveNullAndEmptyArrays: true } },

        { $lookup: { from: 'paramaters', localField: 'paramaters', foreignField: '_id', as: 'paramaters' } },

        { $lookup: { from: 'suppliers', localField: 'supplier', foreignField: '_id', as: 'supplier' } },
        { $unwind: { path: '$supplier', preserveNullAndEmptyArrays: true } },

        { $lookup: { from: 'assets', localField: 'asset', foreignField: '_id', as: 'asset' } },
        { $unwind: { path: '$asset', preserveNullAndEmptyArrays: true } },

        { $project: { stockData: 0 } },
        {
            $addFields: {
                id: { $toString: '$_id' },

                asset: {
                    $cond: [
                        { $ifNull: ['$asset', false] },
                        { $mergeObjects: ['$asset', { id: { $toString: '$asset._id' } }] },
                        null
                    ]
                },

                category: {
                    $cond: [
                        { $ifNull: ['$category', false] },
                        { $mergeObjects: ['$category', { id: { $toString: '$category._id' } }] },
                        null
                    ]
                },

                manufacturer: {
                    $cond: [
                        { $ifNull: ['$manufacturer', false] },
                        { $mergeObjects: ['$manufacturer', { id: { $toString: '$manufacturer._id' } }] },
                        null
                    ]
                },

                supplier: {
                    $cond: [
                        { $ifNull: ['$supplier', false] },
                        { $mergeObjects: ['$supplier', { id: { $toString: '$supplier._id' } }] },
                        null
                    ]
                },

                subCategory: {
                    $cond: [
                        { $ifNull: ['$subCategory', false] },
                        { $mergeObjects: ['$subCategory', { id: { $toString: '$subCategory._id' } }] },
                        null
                    ]
                },

                assetTypeCategory: {
                    $cond: [
                        { $ifNull: ['$assetTypeCategory', false] },
                        { $mergeObjects: ['$assetTypeCategory', { id: { $toString: '$assetTypeCategory._id' } }] },
                        null
                    ]
                },

                // array paramaters
                paramaters: {
                    $map: {
                        input: { $ifNull: ['$paramaters', []] },
                        as: 'p',
                        in: {
                            $mergeObjects: [
                                '$$p',
                                { id: { $toString: '$$p._id' } }
                            ]
                        }
                    }
                }
            }
        },
        {
            $project: {
                _id: 0,
                'asset._id': 0,
                'category._id': 0,
                'manufacturer._id': 0,
                'supplier._id': 0,
                'subCategory._id': 0,
                'assetTypeCategory._id': 0,
                'paramaters._id': 0,
                stockData: 0
            }
        },
        
        { $skip: skip },
        { $limit: limit }
    ];

    const [data, total] = await Promise.all([
        AssetModel.aggregate(pipeline),
        AssetModel.aggregate([
            ...pipeline.filter(stage => !stage.$skip && !stage.$limit),
            { $count: 'total' }
        ])
    ]);

    return {
        results: data,
        page,
        limit,
        totalPages: Math.ceil((total[0]?.total || 0) / limit),
        totalResults: total[0]?.total || 0
    };
};
module.exports = {
    createAssetModel,
    queryAssetModel,
    getAssetModelById,
    updateAssetModelById,
    deleteAssetModelById,
    updateStatus,
    getAllAssetModel,
    getAssetModelByAssetId,
    findOne,
    getAssetModelParameters,
    getAssetModelByAssetTypeAndAsset,
    queryAssetModelStock
}
