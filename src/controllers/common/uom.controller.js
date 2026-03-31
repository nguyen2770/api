const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const catchAsync = require('../../utils/catchAsync');
const { uomService } = require('../../services');
const ApiError = require('../../utils/ApiError');

const getAllUom = catchAsync(async (req, res) => {
    const uoms = await uomService.getAllUom();
    res.send({ code: 1, data: uoms });
});

const getUoms = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['uomName']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await uomService.queryUoms(filter, options);
    res.send({ ...result, code: 1 });
});

const getUomById = catchAsync(async (req, res) => {
    const uom = await uomService.getUomById(req.query.id);
    if (!uom) {
        throw new ApiError(httpStatus.NOT_FOUND, 'uom not found');
    }
    res.send({ uom, code: 1 });
});

const createUom = catchAsync(async (req, res) => {
    await uomService.createUom({
        ...req.body,
        createdBy: req.user.id,
    });
    res.status(httpStatus.CREATED).send({ code: 1, mesage: 'Thêm thành công' });
});

/**
 * Update user by id.
 * @type {(function(*, *, *): void)|*}
 */
const updateUom = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body;
    updateData.updatedBy = req.user.id; // Nếu cần
    const updated = await uomService.updateById(id, updateData);
    res.send({ code: 1, data: updated });
});

/**
 * Delete user by id.
 * @type {(function(*, *, *): void)|*}
 */
const deleteUom = catchAsync(async (req, res) => {
    await uomService.deleteId(req.query.id);
    res.status(httpStatus.OK).send({ code: 1 });
});

const uploadUomExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.send({ code: 0, message: "Not file" })
        }
        const result = await uomService.uploadUomExcel(req.file.path, req.file)
        return res.send({ code: 1, result })
    } catch (error) {
        return res.send({ code: 0, message: error.message || "Tải file lên không thành công" })
    }
};
module.exports = {
    getUoms,
    getAllUom,
    getUomById,
    updateUom,
    createUom,
    deleteUom,
    uploadUomExcel,
};
