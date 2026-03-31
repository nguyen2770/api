const mongoose = require('mongoose');
const { ReceiptPurchaseDetail, SparePart, AssetModel, StockMoveLine, StockLocation } = require('../../models');
// lấy danh sách spareParts vs số lượng trong kho
const querySpareParts = async (filter, options) => {
    const spareParts = await SparePart.paginate(filter, {
        ...options,
        populate: [
            { path: 'spareCategoryId', select: 'spareCategoryName' },
            { path: 'spareSubCategoryId', select: 'spareSubCategoryName' },
            // { path: "manufacturer"},
        ],
    });

    const sparePartIds = spareParts.results.map((sp) => sp._id);

    const stockInfo = await ReceiptPurchaseDetail.aggregate([
        {
            $match: {
                item: { $in: sparePartIds },
                itemType: 'SpareParts',
            },
        },
        {
            $lookup: {
                from: 'receiptpurchases',
                localField: 'receiptPurchase',
                foreignField: '_id',
                as: 'purchase',
            },
        },
        { $unwind: '$purchase' },
        { $match: { 'purchase.action': 'approved' } },
        {
            $group: {
                _id: '$item',
                totalImportQty: { $sum: '$qty' },
            },
        },
        {
            $lookup: {
                from: 'receiptissuedetails',
                let: { itemId: '$_id' },
                pipeline: [
                    {
                        $lookup: {
                            from: 'receiptissues',
                            localField: 'receiptIssue',
                            foreignField: '_id',
                            as: 'issue',
                        },
                    },
                    { $unwind: '$issue' },
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$item', '$$itemId'] },
                                    { $eq: ['$itemType', 'SpareParts'] },
                                    { $eq: ['$issue.action', 'approved'] },
                                ],
                            },
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            totalExportQty: { $sum: '$qty' },
                        },
                    },
                ],
                as: 'exportData',
            },
        },
        {
            $lookup: {
                from: 'returntosupplierdetails',
                let: { itemId: '$_id' },
                pipeline: [
                    {
                        $lookup: {
                            from: 'returntosuppliers',
                            localField: 'returnToSupplier',
                            foreignField: '_id',
                            as: 'returnDoc',
                        },
                    },
                    { $unwind: '$returnDoc' },
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$item', '$$itemId'] },
                                    { $eq: ['$itemType', 'SpareParts'] },
                                    { $eq: ['$returnDoc.action', 'approved'] },
                                ],
                            },
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            totalReturnQty: { $sum: '$qty' },
                        },
                    },
                ],
                as: 'returnData',
            },
        },
        {
            $addFields: {
                totalExportQty: {
                    $ifNull: [{ $arrayElemAt: ['$exportData.totalExportQty', 0] }, 0],
                },
                totalReturnQty: {
                    $ifNull: [{ $arrayElemAt: ['$returnData.totalReturnQty', 0] }, 0],
                },
                stockQty: {
                    $subtract: [
                        '$totalImportQty',
                        {
                            $add: [
                                { $ifNull: [{ $arrayElemAt: ['$exportData.totalExportQty', 0] }, 0] },
                                { $ifNull: [{ $arrayElemAt: ['$returnData.totalReturnQty', 0] }, 0] },
                            ],
                        },
                    ],
                },
            },
        },
        {
            $project: {
                _id: 1,
                stockQty: 1,
            },
        },
    ]);

    const stockMap = new Map(stockInfo.map((item) => [item._id.toString(), item.stockQty]));

    spareParts.results = spareParts.results.map((sp) => ({
        ...sp.toJSON(),
        qty: stockMap.get(sp._id.toString()) || 0,
    }));

    return spareParts;
};

// lấy danh sách assetModels vs số lượng trong kho
const queryAssetModels = async (filter, options) => {
    ['assetTypeCategory', 'supplier', 'category', 'manufacturer', 'subCategory', '_id', 'asset'].forEach((key) => {
        if (filter[key] && typeof filter[key] === 'string' && mongoose.Types.ObjectId.isValid(filter[key])) {
            // eslint-disable-next-line no-param-reassign
            filter[key] = mongoose.Types.ObjectId(filter[key]);
        }
    });
    const _populate = [
        {
            path: 'assetTypeCategory',
        },
        {
            path: 'category',
        },
        {
            path: 'manufacturer',
        },
        {
            path: 'subCategory',
        },
        {
            path: 'paramaters',
        },
        {
            path: 'supplier',
        },
        {
            path: 'asset',
        },
    ];
    const assetModels = await AssetModel.paginate(filter, {
        ...options,
        populate: _populate,
    });

    const assetModelIds = assetModels.results.map((am) => am._id);

    const stockInfo = await ReceiptPurchaseDetail.aggregate([
        {
            $match: {
                item: { $in: assetModelIds },
                itemType: 'AssetModel',
            },
        },
        {
            $lookup: {
                from: 'receiptpurchases',
                localField: 'receiptPurchase',
                foreignField: '_id',
                as: 'purchase',
            },
        },
        { $unwind: '$purchase' },
        { $match: { 'purchase.action': 'approved' } },
        {
            $group: {
                _id: '$item',
                totalImportQty: { $sum: '$qty' },
            },
        },
        {
            $lookup: {
                from: 'receiptissuedetails',
                let: { itemId: '$_id' },
                pipeline: [
                    {
                        $lookup: {
                            from: 'receiptissues',
                            localField: 'receiptIssue',
                            foreignField: '_id',
                            as: 'issue',
                        },
                    },
                    { $unwind: '$issue' },
                    {
                        $match: {
                            'issue.action': 'approved',
                            itemType: 'AssetModel',
                        },
                    },
                    {
                        $match: {
                            $expr: { $eq: ['$item', '$$itemId'] },
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            totalExportQty: { $sum: '$qty' },
                        },
                    },
                ],
                as: 'exportData',
            },
        },
        {
            $lookup: {
                from: 'returntosupplierdetails',
                let: { itemId: '$_id' },
                pipeline: [
                    {
                        $lookup: {
                            from: 'returntosuppliers',
                            localField: 'returnToSupplier',
                            foreignField: '_id',
                            as: 'return',
                        },
                    },
                    { $unwind: '$return' },
                    {
                        $match: {
                            'return.action': 'approved',
                            itemType: 'AssetModel',
                        },
                    },
                    {
                        $match: {
                            $expr: { $eq: ['$item', '$$itemId'] },
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            totalReturnQty: { $sum: '$qty' },
                        },
                    },
                ],
                as: 'returnData',
            },
        },
        {
            $addFields: {
                totalExportQty: {
                    $ifNull: [{ $arrayElemAt: ['$exportData.totalExportQty', 0] }, 0],
                },
                totalReturnQty: {
                    $ifNull: [{ $arrayElemAt: ['$returnData.totalReturnQty', 0] }, 0],
                },
                stockQty: {
                    $subtract: [
                        '$totalImportQty',
                        {
                            $add: [
                                { $ifNull: [{ $arrayElemAt: ['$exportData.totalExportQty', 0] }, 0] },
                                { $ifNull: [{ $arrayElemAt: ['$returnData.totalReturnQty', 0] }, 0] },
                            ],
                        },
                    ],
                },
            },
        },
        {
            $project: {
                _id: 1,
                stockQty: 1,
            },
        },
    ]);

    const stockMap = new Map(stockInfo.map((item) => [item._id.toString(), item.stockQty]));

    assetModels.results = assetModels.results.map((am) => ({
        ...am.toJSON(),
        qty: stockMap.get(am.id.toString()) || 0,
    }));

    return assetModels;
};
const pipelineSparePart = ({ locationId, sparePartId }) => {
    const baseMatch = { itemType: 'SpareParts' };
    if (sparePartId) {
        baseMatch.spareParts = new mongoose.Types.ObjectId(sparePartId);
    }

    const pipeline = [{ $match: baseMatch }];

    pipeline.push(
        {
            $lookup: {
                from: 'stocklocations',
                localField: 'location',
                foreignField: '_id',
                as: 'fromLocation',
            },
        },
        { $unwind: '$fromLocation' },
        {
            $lookup: {
                from: 'stocklocations',
                localField: 'locationDest',
                foreignField: '_id',
                as: 'toLocation',
            },
        },
        { $unwind: '$toLocation' }
    );

    // ===== THEO 1 KHO =====
    if (locationId) {
        pipeline.push(
            {
                $match: {
                    $or: [{ location: locationId }, { locationDest: locationId }],
                },
            },
            {
                $addFields: {
                    importQtyTmp: {
                        $cond: [{ $eq: ['$locationDest', locationId] }, '$productDoneQty', 0],
                    },
                    exportQtyTmp: {
                        $cond: [{ $eq: ['$location', locationId] }, '$productDoneQty', 0],
                    },
                },
            }
        );
    }

    // ===== TỔNG KHO =====
    if (!locationId) {
        pipeline.push({
            $addFields: {
                importQtyTmp: {
                    $cond: [
                        {
                            $and: [{ $eq: ['$fromLocation.usage', 'VIRTUAL'] }, { $eq: ['$toLocation.usage', 'INTERNAL'] }],
                        },
                        '$productDoneQty',
                        0,
                    ],
                },
                exportQtyTmp: {
                    $cond: [
                        {
                            $and: [{ $eq: ['$fromLocation.usage', 'INTERNAL'] }, { $eq: ['$toLocation.usage', 'VIRTUAL'] }],
                        },
                        '$productDoneQty',
                        0,
                    ],
                },
            },
        });
    }

    pipeline.push(
        {
            $group: {
                _id: '$spareParts',
                importQty: { $sum: '$importQtyTmp' },
                exportQty: { $sum: '$exportQtyTmp' },
            },
        },
        {
            $addFields: {
                totalQty: { $subtract: ['$importQty', '$exportQty'] },
            },
        },
        {
            $lookup: {
                from: 'spareparts',
                localField: '_id',
                foreignField: '_id',
                as: 'sparePartInfo',
            },
        },
        { $unwind: '$sparePartInfo' },
        {
            $project: {
                _id: 0,
                sparePartId: '$_id',
                sparePartInfo: 1,
                importQty: 1,
                exportQty: 1,
                totalQty: 1,
            },
        }
    );

    return pipeline;
};

const buildInventoryPipeline = ({ locationId, assetModelId, assetName }) => {
    const baseMatch = {
        itemType: 'AssetModel',
    };
    if (assetModelId) {
        baseMatch.assetModel = new mongoose.Types.ObjectId(assetModelId);
    }

    const pipeline = [{ $match: baseMatch }];

    // ===== CASE 1: THEO 1 KHO =====
    if (locationId) {
        pipeline.push(
            {
                $lookup: {
                    from: 'stocklocations',
                    localField: 'location',
                    foreignField: '_id',
                    as: 'fromLocation',
                },
            },
            { $unwind: '$fromLocation' },
            {
                $lookup: {
                    from: 'stocklocations',
                    localField: 'locationDest',
                    foreignField: '_id',
                    as: 'toLocation',
                },
            },
            { $unwind: '$toLocation' },
            {
                $match: {
                    $or: [{ location: locationId }, { locationDest: locationId }],
                },
            },
            {
                $addFields: {
                    importQtyTmp: {
                        $cond: [{ $eq: ['$locationDest', locationId] }, '$productDoneQty', 0],
                    },
                    exportQtyTmp: {
                        $cond: [{ $eq: ['$location', locationId] }, '$productDoneQty', 0],
                    },
                },
            }
        );
    }

    // ===== CASE 2: TỔNG KHO =====
    if (!locationId) {
        pipeline.push(
            {
                $lookup: {
                    from: 'stocklocations',
                    localField: 'location',
                    foreignField: '_id',
                    as: 'fromLocation',
                },
            },
            { $unwind: '$fromLocation' },
            {
                $lookup: {
                    from: 'stocklocations',
                    localField: 'locationDest',
                    foreignField: '_id',
                    as: 'toLocation',
                },
            },
            { $unwind: '$toLocation' },
            {
                $addFields: {
                    importQtyTmp: {
                        $cond: [
                            {
                                $and: [
                                    { $eq: ['$fromLocation.usage', 'VIRTUAL'] },
                                    { $eq: ['$toLocation.usage', 'INTERNAL'] },
                                ],
                            },
                            '$productDoneQty',
                            0,
                        ],
                    },
                    exportQtyTmp: {
                        $cond: [
                            {
                                $and: [
                                    { $eq: ['$fromLocation.usage', 'INTERNAL'] },
                                    { $eq: ['$toLocation.usage', 'VIRTUAL'] },
                                ],
                            },
                            '$productDoneQty',
                            0,
                        ],
                    },
                },
            }
        );
    }

    // ===== GROUP =====
    pipeline.push(
        {
            $lookup: {
                from: 'users',
                let: { userId: '$createdBy' },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ['$_id', '$$userId'] },
                        },
                    },
                    {
                        $project: {
                            _id: 1,
                            fullName: 1,
                        },
                    },
                ],
                as: 'createdBy',
            },
        },
        {
            $unwind: {
                path: '$createdBy',
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $group: {
                _id: '$assetModel',
                importQty: { $sum: '$importQtyTmp' },
                exportQty: { $sum: '$exportQtyTmp' },
                stockMoveLine: { $push: '$$ROOT' },
            },
        },
        {
            $addFields: {
                totalQty: { $subtract: ['$importQty', '$exportQty'] },
            },
        },
        {
            $lookup: {
                from: 'assetmodels',
                localField: '_id',
                foreignField: '_id',
                as: 'assetModelInfo',
            },
        },
        { $unwind: '$assetModelInfo' },
        {
            $lookup: {
                from: 'assets',
                localField: 'assetModelInfo.asset',
                foreignField: '_id',
                as: 'asset',
            },
        },
        { $unwind: '$asset' }
    );

    if (assetName) {
        pipeline.push({
            $match: {
                'asset.assetName': { $regex: assetName, $options: 'i' },
            },
        });
    }

    // ===== OUTPUT =====
    pipeline.push({
        $project: {
            _id: 0,
            assetModelId: '$_id',
            importQty: 1,
            exportQty: 1,
            totalQty: 1,
            stockMoveLine: 1,
            assetModelInfo: 1,
            asset: 1,
        },
    });

    return pipeline;
};

const paginateAggregate = async ({ model, pipeline, page = 1, limit = 10, sortBy = '_id' }) => {
    const skip = (page - 1) * limit;

    const [results, totalResults] = await Promise.all([
        model.aggregate([...pipeline, { $sort: { [sortBy]: 1, _id: 1 } }, { $skip: skip }, { $limit: limit }]),
        model.aggregate([...pipeline, { $count: 'count' }]),
    ]);

    return {
        results,
        totalResults: totalResults[0]?.count || 0,
        totalPages: Math.ceil((totalResults[0]?.count || 0) / limit),
        page,
        limit,
    };
};

const getTotalLocationInventory = async ({ filter, page, limit }) => {
    const pipeline = buildInventoryPipeline({ ...filter });

    return paginateAggregate({
        model: StockMoveLine,
        pipeline,
        page,
        limit,
        sortBy: 'asset.assetName',
    });
};

const getInventoryByLocation = async ({ filter, locationId, page, limit }) => {
    const pipeline = buildInventoryPipeline({ ...filter, locationId });

    return paginateAggregate({
        model: StockMoveLine,
        pipeline,
        page,
        limit,
        sortBy: 'asset.assetName',
    });
};

const getTotalLocationInventorySparePart = async ({ filter, page, limit }) => {
    const pipeline = pipelineSparePart({ ...filter });

    return paginateAggregate({
        model: StockMoveLine,
        pipeline,
        page,
        limit,
        sortBy: 'sparePartInfo.code',
    });
};

const getInventoryByLocationSparePart = async ({ filter, locationId, page, limit }) => {
    const pipeline = pipelineSparePart({ ...filter, locationId });

    return paginateAggregate({
        model: StockMoveLine,
        pipeline,
        page,
        limit,
        sortBy: 'sparePartInfo.code',
    });
};

const getInventoryAssetModel = async (filter, options) => {
    const page = parseInt(options.page);
    const limit = parseInt(options.limit);

    // 1. totalLocation
    let totalLocation;
    console.log(!!filter.locationId);
    if (!!filter.locationId === false) {
        totalLocation = await getTotalLocationInventory({ filter, page, limit });
    }
    // 2. danh sách kho vật lý
    const query = {
        usage: 'INTERNAL',
        active: true,
    };

    if (filter.locationId) {
        query._id = filter.locationId;
    }
    const locations = await StockLocation.find({
        ...query,
    });

    // 3. tồn theo từng kho
    const locationData = await Promise.all(
        locations.map(async (loc) => ({
            ...loc.toJSON(),
            inventory: await getInventoryByLocation({
                filter,
                locationId: loc._id,
                page,
                limit,
            }),
        }))
    );

    return { totalLocation, locationData };
};

const getInventorySparePart = async (filter, options) => {
    const page = parseInt(options.page);
    const limit = parseInt(options.limit);

    // 1. totalLocation
    let totalLocation;
    if (!!filter.locationId === false) {
        totalLocation = await getTotalLocationInventorySparePart({ filter, page, limit });
    }

    // 2. danh sách kho vật lý
    const query = {
        usage: 'INTERNAL',
        active: true,
    };

    if (filter.locationId) {
        query._id = filter.locationId;
    }
    const locations = await StockLocation.find({
        ...query,
    });

    // 3. tồn theo từng kho
    const locationData = await Promise.all(
        locations.map(async (loc) => ({
            ...loc.toJSON(),
            inventory: await getInventoryByLocationSparePart({
                filter,
                locationId: loc._id,
                page,
                limit,
            }),
        }))
    );
    return { totalLocation, locationData };
};
const getInventoryDetail = async (filter, options) => {
    if (filter.itemId) {
        filter.itemId = mongoose.Types.ObjectId(filter.itemId);
    }

    if (filter.itemType === 'SpareParts') {
        filter.spareParts = filter.itemId;
    } else {
        filter.assetModel = filter.itemId;
    }
    delete filter.itemId;

    if (filter.locationId) {
        filter.$or = [{ location: filter.locationId }, { locationDest: filter.locationId }];
        delete filter.locationId;
    }

    console.log(filter);

    return await StockMoveLine.paginate(filter, {
        ...options,
        populate: [
            {
                path: 'createdBy',
                select: 'fullName',
            },
            {
                path: 'location',
                select: 'code usage',
            },
            {
                path: 'locationDest',
                select: 'code usage',
            },
        ],
    });
};

const getInventoryBySparePartsAndLocation = async ({ spareParts = [], stockLocation }) => {
    const sparePartIds = spareParts.map((id) => new mongoose.Types.ObjectId(id));
    const locId = new mongoose.Types.ObjectId(stockLocation);
    console.log(spareParts);

    console.log(locId);
    const pipeline = [
        {
            $match: {
                $expr: {
                    $and: [
                        { $eq: ['$itemType', 'SpareParts'] },
                        { $in: ['$spareParts', sparePartIds] },
                        {
                            $or: [{ $eq: ['$location', locId] }, { $eq: ['$locationDest', locId] }],
                        },
                    ],
                },
            },
        },

        {
            $addFields: {
                importQtyTmp: {
                    $cond: [{ $eq: ['$locationDest', locId] }, '$productDoneQty', 0],
                },
                exportQtyTmp: {
                    $cond: [{ $eq: ['$location', locId] }, '$productDoneQty', 0],
                },
            },
        },
        {
            $group: {
                _id: '$spareParts',
                importQty: { $sum: '$importQtyTmp' },
                exportQty: { $sum: '$exportQtyTmp' },
            },
        },
        {
            $project: {
                _id: 0,
                sparePartId: '$_id',
                totalQty: { $subtract: ['$importQty', '$exportQty'] },
                importQty: 1,
                exportQty: 1,
            },
        },
    ];

    return StockMoveLine.aggregate(pipeline);
};

module.exports = {
    querySpareParts,
    queryAssetModels,
    getInventorySparePart,
    getInventoryAssetModel,
    getInventoryBySparePartsAndLocation,
    getInventoryDetail,
};
