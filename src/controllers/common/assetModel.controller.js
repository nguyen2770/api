const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const catchAsync = require('../../utils/catchAsync');
const { assetModelService, assetService } = require('../../services')
const ApiError = require('../../utils/ApiError');

/**
 * Create a user
 * @type {(function(*, *, *): void)|*}
 */

const createAssetModel = catchAsync(async (req, res) => {
    const AssetModel = await assetModelService.createAssetModel({
        ...req.body,
        // createdBy: req.user?.id,
        // updatedBy: req.user?.id,
    });
    res.status(httpStatus.CREATED).send({ code: 1, AssetModel });
});

const getAssetModel = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['category', 'subCategory', 'assetTypeCategory', 'manufacturer', 'assetName', 'assetModelName', 'supplier', 'asset']);
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

    const result = await assetModelService.queryAssetModel(filter, options);
    // const assetModels = [];
    // eslint-disable-next-line no-plusplus
    // for (let i = 0; i < result.results.length; i++) {
    //     const element = result.results[i].toObject();
    //     // eslint-disable-next-line no-await-in-loop
    //     // eslint-disable-next-line no-await-in-loop
    //     element.id = element._id;
    //     // eslint-disable-next-line no-await-in-loop
    //     element.assetModelParameters = await assetModelService.getAssetModelParameters(element.id);
    //     assetModels.push(element);
    // }
    // res.send({ results: { ...result, results: assetModels } });

    res.send({ results: { ...result } });

});

const getAssetModelById = catchAsync(async (req, res) => {
    const assetModel = await assetModelService.getAssetModelById(req.params.id);
    if (!assetModel) {
        throw new ApiError(httpStatus.NOT_FOUND, 'assetModel not found');
    }
    res.send({ code: 1, assetModel });
});

/**
 * Update user by id.
 * @type {(function(*, *, *): void)|*}
 */
const updateAssetModel = catchAsync(async (req, res) => {
    // const { id, ...updateData } = req.body.AssetModel;
    // updateData.updatedBy = req.user.id; // Nếu cần
    const updated = await assetModelService.updateAssetModelById(req.params.id, req.body);
    res.send({ code: 1, data: updated });
});
const updateAssetModelStatus = catchAsync(async (req, res) => {
    // const { id, ...updateData } = req.body.AssetModel;
    // updateData.updatedBy = req.user.id; // Nếu cần
    const assetModel = await assetModelService.getAssetModelById(req.params.id);
    if (!assetModel) {
        throw new ApiError(httpStatus.NOT_FOUND, 'assetModel not found');
    }
    const updated = await assetModelService.updateAssetModelById(req.params.id, { status: !assetModel.status });
    res.send({ code: 1, data: updated });
});
/**
 * Delete user by id.
 * @type {(function(*, *, *): void)|*}
 */
const deleteAssetModel = catchAsync(async (req, res) => {
    await assetModelService.deleteAssetModelById(req.query.id);
    res.status(httpStatus.OK).send({ code: 1 });
});

const getAllAssetModel = catchAsync(async (req, res) => {
    const AssetModel = await assetModelService.getAllAssetModel();
    res.send({ code: 1, data: AssetModel });
});

const getAssetModelByAssetId = catchAsync(async (req, res) => {
    const AssetModel = await assetModelService.getAssetModelByAssetId(req.query.id)
    res.send({ code: 1, data: AssetModel })
})

const getAssetModelByAssetTypeAndAsset = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['category', 'subCategory', 'manufacturer', 'assetModelName', 'asset', 'supplier']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await assetModelService.getAssetModelByAssetTypeAndAsset(filter, options);
    const assetModels = [];
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < result.results.length; i++) {
        const element = result.results[i].toObject();
        // eslint-disable-next-line no-await-in-loop
        // eslint-disable-next-line no-await-in-loop
        element.id = element._id;
        // eslint-disable-next-line no-await-in-loop
        element.assetModelParameters = await assetModelService.getAssetModelParameters(element.id);
        assetModels.push(element);
    }
    res.send({ results: { ...result, results: assetModels } });
});

const getAssetModelStock = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['category', 'subCategory', 'assetTypeCategory', 'manufacturer', 'assetName', 'assetModelName', 'supplier', 'asset']);
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

    const result = await assetModelService.queryAssetModelStock(filter, options);

    res.send({ results: { ...result } });

});
module.exports = {
    createAssetModel,
    getAssetModel,
    getAssetModelById,
    updateAssetModel,
    deleteAssetModel,
    getAllAssetModel,
    getAssetModelByAssetId,
    updateAssetModelStatus,
    getAssetModelByAssetTypeAndAsset,
    getAssetModelStock
};
