const mongoose = require('mongoose');
const pick = require('../../utils/pick');
const catchAsync = require('../../utils/catchAsync');
const { inventoryService, assetService, assetModelService, userService } = require('../../services');
const { inventoryController } = require('..');

const getSpareParts = catchAsync(async (req, res) => {
    const { code, sparePartsName, manufacturer } = req.query;
    const filter = {};
    // Xử lý tìm kiếm theo sparePartsName hoặc _id với toán tử OR
    const orConditions = [];

    if (req.query.sparePartsName) {
        orConditions.push({ sparePartsName: { $regex: req.query.sparePartsName, $options: 'i' } });
        orConditions.push({ code: { $regex: req.query.sparePartsName, $options: 'i' } });
    }

    if (req.query.searchValue) {
        orConditions.push({ sparePartsName: { $regex: req.query.searchValue, $options: 'i' } });
        orConditions.push({ code: { $regex: req.query.searchValue, $options: 'i' } });
    }

    if (req.query._id && mongoose.Types.ObjectId.isValid(req.query._id)) {
        orConditions.push({ _id: req.query._id });
    }

    if (orConditions.length > 0) {
        filter.$or = orConditions;
    }

    if (code && code.trim()) {
        filter.code = { $regex: code, $options: 'i' };
    }

    if (sparePartsName && sparePartsName.trim()) {
        filter.sparePartsName = { $regex: sparePartsName, $options: 'i' };
    }
    if (manufacturer && manufacturer.trim()) {
        filter.manufacturer = { $regex: manufacturer, $options: 'i' };
    }

    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await inventoryService.querySpareParts(filter, options);
    res.send({ results: result });
});

const getAssetModels = catchAsync(async (req, res) => {
    const filter = pick(req.query, [
        'category',
        'subCategory',
        'assetTypeCategory',
        'manufacturer',
        'assetName',
        'assetModelName',
        'supplier',
        'asset',
        'searchValue',
    ]);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);

    if (filter.assetName) {
        const assets = await assetService.getAssetByAssetName(filter.assetName);
        if (assets.length > 0) {
            const assetIds = assets.map((a) => a._id);
            filter.asset = { $in: assetIds };
        } else {
            return res.send({ results: { results: [], totalResults: 0, totalPages: 0, page: 1 } });
        }
        delete filter.assetName;
    }

    if (filter.searchValue == '') {
        delete filter.searchValue;
    }

    if (filter.searchValue && filter.searchValue != '') {
        const matchingAssets = await assetService.getAssetByAssetName(filter.searchValue);
        const assetIds = matchingAssets.map((a) => a._id);

        // Xây dựng bộ lọc OR cho asset hoặc assetModelName
        filter.$or = [{ assetModelName: { $regex: filter.searchValue, $options: 'i' } }];

        if (assetIds.length > 0) {
            filter.$or.push({ asset: { $in: assetIds } });
        }

        // Xóa các field riêng lẻ để tránh xung đột
        delete filter.assetName;
        delete filter.assetModelName;
        delete filter.searchValue;
    }

    const result = await inventoryService.queryAssetModels(filter, options);
    const assetModels = [];
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < result.results.length; i++) {
        const element = result.results[i];
        // eslint-disable-next-line no-await-in-loop
        // eslint-disable-next-line no-await-in-loop
        // eslint-disable-next-line no-await-in-loop
        element.assetModelParameters = await assetModelService.getAssetModelParameters(element.id);
        assetModels.push(element);
    }
    // console.log(assetModels);
    res.send({ results: { ...result, results: assetModels } });
});

const getInventorySparePart = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['sparePartId', 'locationId']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const inventorySparePart = await inventoryService.getInventorySparePart(filter, options);
    res.send(inventorySparePart);
});

const getInventoryAssetModel = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['assetModelId', 'assetName', 'locationId']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const inventorySparePart = await inventoryService.getInventoryAssetModel(filter, options);
    res.send(inventorySparePart);
});

const getInventoryDetail = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['itemId', 'itemType', 'locationId']);
    const options = pick(req.query, ['page', 'limit']);

    const inventorySparePart = await inventoryService.getInventoryDetail(filter, options);

    res.send(inventorySparePart);
});

const getInventorySpareParts = catchAsync(async (req, res) => {
    const arr = [...new Set(Object.values(req.body.spareParts))];
    const companySetting = await userService.getCompanySetting(req.company);
    const inventory = await inventoryService.getInventoryBySparePartsAndLocation({
        spareParts: arr,
        stockLocation: companySetting.locationDefault,
    });

    res.send(inventory);
});

module.exports = {
    getSpareParts,
    getAssetModels,
    getInventorySparePart,
    getInventoryAssetModel,
    getInventorySpareParts,
    getInventoryDetail,
};
