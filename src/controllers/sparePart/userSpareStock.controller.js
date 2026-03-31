const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const catchAsync = require('../../utils/catchAsync');
const { userSpareStockService } = require('../../services');
const ApiError = require('../../utils/ApiError');

const createUserSpareStock = catchAsync(async (req, res) => {
    const userSpareStock = await userSpareStockService.createUserSpareStock({
        ...req.body,
        // createdBy: req.user?.id,
        // updatedBy: req.user?.id,
    });
    res.status(httpStatus.CREATED).send({ code: 1, userSpareStock });
});

const getUserSpareStocks = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['name', 'sparePartsId']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await userSpareStockService.queryUserSpareStocks(filter, options);
    res.send({ results: result, code: 1 });
});

const getUserSpareStockById = catchAsync(async (req, res) => {
    const userSpareStock = await userSpareStockService.getUserSpareStockById(req.query.id);
    if (!userSpareStock) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User spare stock not found');
    }
    res.send({code: 1,userSpareStock});
});

const updateUserSpareStock = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body.userSpareStock;
    // updateData.updatedBy = req.user.id; // Nếu cần
    const updated = await userSpareStockService.updateUserSpareStockById(id, updateData);
    res.send({ code: 1, data: updated });
});

const deleteUserSpareStock = catchAsync(async (req, res) => {
    await userSpareStockService.deleteUserSpareStockById(req.query.id);
    res.status(httpStatus.OK).send({ code: 1 });
});

const getAllUserSpareStocks = catchAsync(async (req, res) => {
    const userSpareStocks = await userSpareStockService.getAllUserSpareStocks();
    res.send({ code: 1, data: userSpareStocks });
});

const getUserSpareStockBySparePartsId = catchAsync(async (req, res) => {
    const { sparePartId } = req.query;
    if (!sparePartId) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Spare parts ID is required');
    }
    const userSpareStock = await userSpareStockService.getUserSpareStockBySparePartsId(sparePartId);
    if (!userSpareStock) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User spare stock not found for the given spare parts ID');
    }
    res.send({code: 1, userSpareStock});
});

module.exports = {
    createUserSpareStock,
    getUserSpareStocks,
    getUserSpareStockById,
    updateUserSpareStock,
    deleteUserSpareStock,
    getAllUserSpareStocks,
    getUserSpareStockBySparePartsId,
};
