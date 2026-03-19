const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const catchAsync = require('../../utils/catchAsync');
const { assetModelDocumentService } = require('../../services');

const createAssetDocuments = catchAsync(async (req, res) => {
    // req.body = {
    //     ...req.body,
    //     createdBy: req.user.id,
    //     updatedBy: req.user.id,
    // };
    const assetModelDoc = await assetModelDocumentService.createAssetModelDocuments(req.body.resources);
    res.status(httpStatus.CREATED).send({ code: 1, assetModelDoc });
});

const queryAssetModelDocuments = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['assetModel']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await assetModelDocumentService.queryAssetModelDocuments(filter, options);
    res.send({ results: result , code :1});
});

const deleteAssetModelDocument = catchAsync(async (req, res) => {
    await assetModelDocumentService.deleteAssetModelDocument(req.query.id);
    res.status(httpStatus.OK).send({ code: 1 });
});

const findAssetModelDocumentById = catchAsync(async (req, res) => {
    await assetModelDocumentService.findAssetModelDocumentById(req.query.id);
    res.status(httpStatus.OK).send({ code: 1 });
});
const updateAssetModelDocument = catchAsync(async (req, res) => {
    const updated = await assetModelDocumentService.updateAssetModelDocument(req.params.id, req.body);
    res.send({ code: 1, data: updated });
});

const getAllAssetModelDocByAssetModel = catchAsync(async (req, res) => {
    const assetModelDoc = await assetModelDocumentService.getAllAssetModelDocByAssetModel(req.query.assetModel);
    res.send({ code: 1, data: assetModelDoc });
});

module.exports = {
    createAssetDocuments,
    queryAssetModelDocuments,
    deleteAssetModelDocument,
    updateAssetModelDocument,
    findAssetModelDocumentById,
    getAllAssetModelDocByAssetModel
}