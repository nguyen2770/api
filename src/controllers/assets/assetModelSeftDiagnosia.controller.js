const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const catchAsync = require('../../utils/catchAsync');
const { assetModelSeftDiagnosiaService } = require('../../services');
const ApiError = require('../../utils/ApiError');

/**
 * Create a user
 * @type {(function(*, *, *): void)|*}
 */
const createAssetModelSeftDiagnosia = catchAsync(async (req, res) => {
    req.body = {
        ...req.body,
        createdBy: req.user.id,
        updatedBy: req.user.id,
    };
    const assetModelSeftDiagnosiaCreate = {
        ...req.body,
        createdBy: req.user.id,
        updatedBy: req.user.id,
    }
    const assetModelSeftDiagnosia = await assetModelSeftDiagnosiaService.createAssetModelSeftDiagnosia(assetModelSeftDiagnosiaCreate, req.body.tags, req.body.assetModelSeftDiagnosiaAnswerValues);
    res.status(httpStatus.CREATED).send({ code: 1, assetModelSeftDiagnosia });
});
const getAssetModelSeftDiagnosias = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['assetModel']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await assetModelSeftDiagnosiaService.queryAssetModelSeftDiagnosias(filter, options);
    res.send({ results: result , code: 1});
});

const getAssetModelSeftDiagnosiaById = catchAsync(async (req, res) => {
    const assetModelSeftDiagnosia = await assetModelSeftDiagnosiaService.getAssetModelSeftDiagnosiaById(req.params.id);
    if (!assetModelSeftDiagnosia) {
        throw new ApiError(httpStatus.NOT_FOUND, 'category not found');
    }
    const values = await assetModelSeftDiagnosiaService.getValuesBySeftDIagnosiaId(req.params.id)
    res.send({
        code: 1, data: {
            assetModelSeftDiagnosia, values
        }
    });
});

/**
 * Update user by id.
 * @type {(function(*, *, *): void)|*}
 */
const updateAssetModelSeftDiagnosia = catchAsync(async (req, res) => {
    // updateData.updatedBy = req.user.id; // Nếu cần
    const assetModelSeftDiagnosiaCreate = {
        ...req.body,
        createdBy: req.user.id,
        updatedBy: req.user.id,
    }
    const updated = await assetModelSeftDiagnosiaService.updateAssetModelSeftDiagnosiaById(req.params.id, assetModelSeftDiagnosiaCreate, req.body.tags, req.body.assetModelSeftDiagnosiaAnswerValues);
    res.send({ code: 1, data: updated });
});
const updateStatus = catchAsync(async (req, res) => {
    // updateData.updatedBy = req.user.id; // Nếu cần
    const updated = await assetModelSeftDiagnosiaService.updateStatus(req.params.id);
    res.send({ code: 1, data: updated });
});

/**
 * Delete user by id.
 * @type {(function(*, *, *): void)|*}
 */
const deleteAssetModelSeftDiagnosia = catchAsync(async (req, res) => {
    await assetModelSeftDiagnosiaService.deleteAssetModelSeftDiagnosiaById(req.query.id);
    res.status(httpStatus.OK).send({ code: 1 });
});

const getAllAssetModelSeftDiagnosia = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['assetModel', 'assetModelFailureType']);
    const assetModelSeftDiagnosias = await assetModelSeftDiagnosiaService.getAllAssetModelSeftDiagnosia(filter);
    const data = [];
    if (assetModelSeftDiagnosias.length > 0) {
        // eslint-disable-next-line no-plusplus
        for (let index = 0; index < assetModelSeftDiagnosias.length; index++) {
            const element = assetModelSeftDiagnosias[index].toObject();
            // eslint-disable-next-line no-await-in-loop
            element.tags = await assetModelSeftDiagnosiaService.getTagsBySeftDIagnosiaId(element._id);
            // eslint-disable-next-line no-await-in-loop
            element.values = await assetModelSeftDiagnosiaService.getValuesBySeftDIagnosiaId(element._id);
            data.push(element);
        }
    }
    res.send({ code: 1, data });
});
const uploadExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.send({ code: 0, message: "Not file" })
        }
        const result = await assetModelSeftDiagnosiaService.uploadExcel(req.file.path, req.file, req)
        return res.send({ code: 1, result })
    } catch (error) {
        return res.send({ code: 0, message: error.message || "Tải file lên không thành công" })
    }
};

module.exports = {
    createAssetModelSeftDiagnosia,
    getAssetModelSeftDiagnosias,
    getAssetModelSeftDiagnosiaById,
    updateAssetModelSeftDiagnosia,
    deleteAssetModelSeftDiagnosia,
    getAllAssetModelSeftDiagnosia,
    updateStatus,
    uploadExcel,
};
