const { AssetModelDocumentModel } = require('../../models');

const createAssetModelDocuments = async (data) => {
  const assetModelDoc = await AssetModelDocumentModel.insertMany(data)
  return assetModelDoc;
}

const queryAssetModelDocuments = async (filter, options) => {
  const assetModelDoc = await AssetModelDocumentModel.paginate(filter, options)
    .populate({ path: "assetModel" })
    .populate({ path: "resourceId" });;
  return assetModelDoc;
};

const deleteAssetModelDocument = async (id) => {
  const assetModelDoc = await AssetModelDocumentModel.findByIdAndDelete(id);
  return assetModelDoc
}

const findAssetModelDocumentById = async (id) => {
  const assetModelDoc = await AssetModelDocumentModel.findById(id)
    .populate({ path: "assetModel" })
    .populate({ path: "resourceId" });
  return assetModelDoc;
}

const updateAssetModelDocument = async (id, data) => {
  const assetModelDoc = await AssetModelDocumentModel.findByIdAndUpdate(
    id,
    data,
    { new: true }
  );
  if (!assetModelDoc) {
    throw new Error('Document not found');
  }
  return assetModelDoc;
};

const getAllAssetModelDocByAssetModel = async (id) => {
  const assetModelDocs = await AssetModelDocumentModel.find({ assetModel: id })
    .populate({ path: "assetModel" })
    .populate({
      path: "resourceId",
      populate: [
        {
          path: 'createdBy',
          select: 'fullName'
        }
      ]
    }).lean();
  const formattedDocs = assetModelDocs.map(doc => {
    const { resourceId, ...rest } = doc;
    return {
      ...rest,
      resource: resourceId
    };
  });

  return formattedDocs;
}


module.exports = {
  createAssetModelDocuments,
  queryAssetModelDocuments,
  deleteAssetModelDocument,
  updateAssetModelDocument,
  findAssetModelDocumentById,
  getAllAssetModelDocByAssetModel
}