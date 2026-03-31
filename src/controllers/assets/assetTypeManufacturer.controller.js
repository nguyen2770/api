const httpStatus = require('http-status');
const mongoose = require('mongoose');
const pick = require('../../utils/pick');
const catchAsync = require('../../utils/catchAsync');
const { assetTypeManufacturerService, assetTypeService } = require('../../services');
const ApiError = require('../../utils/ApiError');

const createAssetTypeManufacturer = catchAsync(async (req, res) => {
    req.body = {
        ...req.body,
        createdBy: req.user.id,
        updatedBy: req.user.id,
    };
    const AssetTypeManufacturer = await assetTypeManufacturerService.createAssetTypeManufacturer(req.body);
    res.status(httpStatus.CREATED).send({ code: 1, AssetTypeManufacturer });
});

const getAssetTypeManufacturers = catchAsync(async (req, res) => {
    const {assetType} = req.query;
    const filter = {};
    if (assetType && assetType.trim()) {
            filter.assetType = new mongoose.Types.ObjectId(assetType);
    }
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await assetTypeManufacturerService.queryAssetTypeManufacturers(filter, options);
    res.send({ results: result, code: 1 });
});

const getAssetTypeManufacturerById = catchAsync(async (req, res) => {
    const AssetTypeManufacturer = await assetTypeManufacturerService.getAssetTypeManufacturerById(req.query.id);
    if (!AssetTypeManufacturer) {
        throw new ApiError(httpStatus.NOT_FOUND, 'AssetTypeManufacturer not found');
    }
    res.send({ code: 1, data: AssetTypeManufacturer });
});

const updateAssetTypeManufacturer = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body.data;
    updateData.updatedBy = req.user.id;
    const updated = await assetTypeManufacturerService.updateAssetTypeManufacturerById(id, updateData);
    res.send({ code: 1, data: updated });
});

const deleteAssetTypeManufacturer = catchAsync(async (req, res) => {
    await assetTypeManufacturerService.deleteAssetTypeManufacturerById(req.query.id);
    res.status(httpStatus.OK).send({ code: 1 });
});

const getAllAssetTypeManufacturer = catchAsync(async (req, res) => {
    const assetTypes = await assetTypeManufacturerService.getAllAssetTypeManufacturer();
    res.send({ code: 1, data: assetTypes });
});

const updateManufacturersOfAssetType = catchAsync(async (req, res) => {
    const {assetTypeId, manufacturerIds} = req.body;
    const update = await assetTypeManufacturerService.updateManufacturersOfAssetType(assetTypeId, manufacturerIds);
    res.send({code: 1, data: update})
})

const getAssetTypeManufacturerByAssetType = catchAsync(async (req, res) => {
    
    const assetTypeManufacturer = await assetTypeManufacturerService.getAssetTypeManufacturerByAssetType(req.query.assetType);
    res.send({code: 1, data: assetTypeManufacturer})
})

const getAssetTypeManufacturerByAsset = catchAsync(async (req, res) => {
    const assetTypes = await assetTypeService.getAllAssetTypeByAsset(req.query.asset);
    const assetTypeIds = assetTypes.map(t => t._id);

    const manufacturers = await assetTypeManufacturerService.getAssetTypeManufacturerByAssetType(assetTypeIds);
    res.send({ code: 1, data: manufacturers });

})
module.exports = {
    createAssetTypeManufacturer,
    getAssetTypeManufacturers,
    getAssetTypeManufacturerById,
    updateAssetTypeManufacturer,
    deleteAssetTypeManufacturer,
    getAllAssetTypeManufacturer,
    updateManufacturersOfAssetType,
    getAssetTypeManufacturerByAssetType,
    getAssetTypeManufacturerByAsset,
};
