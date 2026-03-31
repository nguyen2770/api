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
    getAssetModelByAssetTypeAndAsset
}
