const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const catchAsync = require('../../utils/catchAsync');
const { customerSpareStockService } = require('../../services');
const ApiError = require('../../utils/ApiError');

const createCustomerSpareStock = catchAsync(async (req, res) => {
    const customerSpareStock = await customerSpareStockService.createCustomerSpareStock({
        ...req.body,
        // createdBy: req.user?.id,
        // updatedBy: req.user?.id,
    });

    
    res.status(httpStatus.CREATED).send({ code: 1, customerSpareStock });
});

const getCustomerSpareStocks = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['name', 'sparePartsId']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await customerSpareStockService.queryCustomerSpareStocks(filter, options);
    res.send({ results: result, code: 1 });
});

const getCustomerSpareStockById = catchAsync(async (req, res) => {
    const customerSpareStock = await customerSpareStockService.getCustomerSpareStockById(req.query.id);
    if (!customerSpareStock) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Customer spare stock not found');
    }
    res.send({code: 1, customerSpareStock});
});

const updateCustomerSpareStock = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body.customerSpareStock;
    // updateData.updatedBy = req.user.id; // Nếu cần
    const updated = await customerSpareStockService.updateCustomerSpareStockById(id, updateData);
    res.send({ code: 1, data: updated });
});

const deleteCustomerSpareStock = catchAsync(async (req, res) => {
    await customerSpareStockService.deleteCustomerSpareStockById(req.query.id);
    res.status(httpStatus.OK).send({ code: 1 });
});

const getAllCustomerSpareStocks = catchAsync(async (req, res) => {
    const customerSpareStocks = await customerSpareStockService.getAllCustomerSpareStocks();
    res.send({ code: 1, data: customerSpareStocks });
});

const getCustomerSpareStockBySparePartsId = catchAsync(async (req, res) => {
    const { sparePartId } = req.query;
    if (!sparePartId) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Spare parts ID is required');
    }
    const customerSpareStock = await customerSpareStockService.findCustomerSpareStockBySparePartsId(sparePartId);
    if (!customerSpareStock) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Customer spare stock not found for the given spare parts ID');
    }
    res.send(customerSpareStock);
});

module.exports = {
    createCustomerSpareStock,
    getCustomerSpareStocks,
    getCustomerSpareStockById,
    updateCustomerSpareStock,
    deleteCustomerSpareStock,
    getAllCustomerSpareStocks,
    getCustomerSpareStockBySparePartsId,
};