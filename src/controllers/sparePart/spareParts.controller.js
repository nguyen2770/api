const httpStatus = require('http-status');
const mongoose = require('mongoose');
const pick = require('../../utils/pick');
const catchAsync = require('../../utils/catchAsync');
const { sparePartsService } = require('../../services');
const ApiError = require('../../utils/ApiError');

const createSparePart = catchAsync(async (req, res) => {
    const sparePart = await sparePartsService.createSparePart({
        ...req.body,
        // createdBy: req.user?.id,
        // updatedBy: req.user?.id,
    });
    res.status(httpStatus.CREATED).send({ code: 1, sparePart });
});

const getSpareParts = catchAsync(async (req, res) => {
    const { code, sparePartsName, manufacturer, spareCategoryId } = req.query;
    const filter = {};

    // // Xử lý tìm kiếm theo sparePartsName hoặc _id với toán tử OR
    // const orConditions = [];

    // if (req.query.search) {
    //     orConditions.push({ sparePartsName: { $regex: req.query.search, $options: 'i' } });
    //     orConditions.push({ code: { $regex: req.query.search, $options: 'i' } });
    // }

    // if (orConditions.length > 0) {
    //     filter.$or = orConditions;
    // }

    if (code && code.trim()) {
        filter.code = { $regex: code, $options: 'i' };
    }
    if (sparePartsName && sparePartsName.trim()) {
        filter.sparePartsName = { $regex: sparePartsName, $options: 'i' };
    }
    if (manufacturer && manufacturer.trim()) {
        filter.manufacturer = new mongoose.Types.ObjectId(manufacturer);
    }
    if (spareCategoryId && spareCategoryId.trim()) {
        filter.spareCategoryId = new mongoose.Types.ObjectId(spareCategoryId);
    }

    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await sparePartsService.querySpareParts(filter, options);
    res.send({ results: result, code: 1 });
});

const getSparePartById = catchAsync(async (req, res) => {
    const sparePart = await sparePartsService.getSparePartById(req.query.id);
    if (!sparePart) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Spare part not found');
    }
    res.send({ code: 1, sparePart });
});

const updateSparePart = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body.sparePart;
    // updateData.updatedBy = req.user.id; // Nếu cần
    const updated = await sparePartsService.updateSparePartById(id, updateData);
    res.send({ code: 1, data: updated });
});

const deleteSparePart = catchAsync(async (req, res) => {
    await sparePartsService.deleteSparePartById(req.query.id);
    res.status(httpStatus.OK).send({ code: 1 });
});

const getAllSpareParts = catchAsync(async (req, res) => {
    const spareParts = await sparePartsService.getAllSpareParts();
    res.send({ code: 1, data: spareParts });
});

const updateStatus = catchAsync(async (req, res) => {
    const { id, status } = req.body;
    const updated = await sparePartsService.updateSparePartStatus(id, status);
    res.send({ code: 1, data: updated });
});

const getSparePartDetails = catchAsync(async (req, res) => {
    const filter = {};
    if (req.query.sparePart && mongoose.Types.ObjectId.isValid(req.query.sparePart)) {
        filter.sparePart = new mongoose.Types.ObjectId(req.query.sparePart);
    }
    if (req.query.manufacturer && mongoose.Types.ObjectId.isValid(req.query.manufacturer)) {
        filter.manufacturer = new mongoose.Types.ObjectId(req.query.manufacturer);
    }
    if (req.query.supplier && mongoose.Types.ObjectId.isValid(req.query.supplier)) {
        filter.supplier = new mongoose.Types.ObjectId(req.query.supplier);
    }
    if (req.query.origin && req.query.origin.trim()) {
        filter.origin = { $regex: req.query.origin, $options: 'i' };
    }
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await sparePartsService.querySparePartDetails(filter, options);
    res.send({ results: result, code: 1 });
});

const getSparePartDetailByQrCode = catchAsync(async (req, res) => {
    const { qrCode } = req.query;
    const sparePartDetail = await sparePartsService.getSparePartDetailByQrCode(qrCode);
    if (!sparePartDetail) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Spare Part Detail not found');
    }
    res.send({ code: 1, data: sparePartDetail });
});

const updateSparePartDetailByQrCode = catchAsync(async (req, res) => {
    const { qrCode, updateData } = req.body;
    const updatedDetail = await sparePartsService.updateSparePartDetailByQrCode(qrCode, updateData);
    if (!updatedDetail) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Spare Part Detail not found for update');
    }
    res.send({ code: 1, data: updatedDetail });
});
const uploadExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.send({ code: 0, message: "Not file" })
        }
        const result = await sparePartsService.uploadExcel(req.file.path, req.file, req)
        return res.send({ code: 1, result })
    } catch (error) {
        return res.send({ code: 0, message: error.message || "Tải file lên không thành công" })
    }
};
module.exports = {
    createSparePart,
    getSpareParts,
    getSparePartById,
    updateSparePart,
    deleteSparePart,
    getAllSpareParts,
    updateStatus,
    getSparePartDetails,
    getSparePartDetailByQrCode,
    updateSparePartDetailByQrCode,
    uploadExcel,
};
