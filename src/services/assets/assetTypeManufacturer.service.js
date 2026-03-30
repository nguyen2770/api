const httpStatus = require('http-status');
const { AssetTypeManufacturerModel } = require('../../models');
const ApiError = require('../../utils/ApiError');

const createAssetTypeManufacturer = async (data) => {
    return AssetTypeManufacturerModel.create(data);
};

const queryAssetTypeManufacturers = async (filter, options) => {
  const assetTypeManufacturers = await AssetTypeManufacturerModel.paginate(filter, {
    ...options,
    populate: {
      path: 'manufacturer',
      select: 'manufacturerName origin',
      populate: {
        path: 'origin',
        select: 'originName'
      }
    }
  });
  return assetTypeManufacturers;
};



const getAssetTypeManufacturerById = async (id) => {
    return AssetTypeManufacturerModel.findById(id);
};

const updateAssetTypeManufacturerById = async (id, updateBody) => {
    const assetTypeManufacturer = await getAssetTypeManufacturerById(id);
    if (!assetTypeManufacturer) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Asset not found');
    }
    Object.assign(assetTypeManufacturer, updateBody);
    await assetTypeManufacturer.save();
    return assetTypeManufacturer;
};

const deleteAssetTypeManufacturerById = async (id) => {
    const assetTypeManufacturer = await getAssetTypeManufacturerById(id);
    if (!assetTypeManufacturer) {
        throw new ApiError(httpStatus.NOT_FOUND, 'assetTypeManufacturer not found');
    }
    await assetTypeManufacturer.remove();
    return assetTypeManufacturer;
};

const getAllAssetTypeManufacturer = async () => {
    const assetTypeManufacturers = await AssetTypeManufacturerModel.find();
    return assetTypeManufacturers;
};

const updateManufacturersOfAssetType = async (assetTypeId, manufacturerIds) => {

    await AssetTypeManufacturerModel.deleteMany({ assetType: assetTypeId });

  
    const insertPromises = manufacturerIds.map((manufacturerId) =>
        AssetTypeManufacturerModel.create({ assetType: assetTypeId, manufacturer: manufacturerId })
    );
    await Promise.all(insertPromises);

};

const getAssetTypeManufacturerByAssetType = async (assetType) => {
    const ids = Array.isArray(assetType) ? assetType : [assetType];
    const assetTypeManufacturer = await AssetTypeManufacturerModel.find({ assetType: { $in: ids } })
        .populate({path: "manufacturer"})
        .populate({path: "assetType"});

    return assetTypeManufacturer
}

module.exports = {
    queryAssetTypeManufacturers,
    getAssetTypeManufacturerById,
    updateAssetTypeManufacturerById,
    deleteAssetTypeManufacturerById,
    createAssetTypeManufacturer,
    getAllAssetTypeManufacturer,
    updateManufacturersOfAssetType,
    getAssetTypeManufacturerByAssetType,
};
