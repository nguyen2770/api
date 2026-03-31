const httpStatus = require('http-status');
const { CustomerSpareStock } = require('../../models');
const ApiError = require('../../utils/ApiError');

const createCustomerSpareStock = async (customerSpareStock) => {
    const createdCustomerSpareStock = await CustomerSpareStock.create(customerSpareStock);
    return createdCustomerSpareStock;
};

const queryCustomerSpareStocks = async (filter, options) => {
    const customerSpareStocks = await CustomerSpareStock.paginate(filter, options);
    return customerSpareStocks;
};

const getCustomerSpareStockById = async (id) => {
    const customerSpareStock = await CustomerSpareStock.findById(id);
    return customerSpareStock;
};

const updateCustomerSpareStockById = async (id, customerSpareStockData) => {
    const updatedCustomerSpareStock = await CustomerSpareStock.findByIdAndUpdate(id, customerSpareStockData, { new: true });
    return updatedCustomerSpareStock;
};

const deleteCustomerSpareStockById = async (id) => {
    const customerSpareStock = await getCustomerSpareStockById(id);
    if (!customerSpareStock) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Customer spare stock not found');
    }
    await customerSpareStock.remove();
    return customerSpareStock;
};

const getAllCustomerSpareStocks = async () => {
    const customerSpareStocks = await CustomerSpareStock.find();
    return customerSpareStocks;
};

const findCustomerSpareStockBySparePartsId = async (sparePartId) => {
    const customerSpareStocks = await CustomerSpareStock.find({ sparePartId });
    if (!customerSpareStocks || customerSpareStocks.length === 0) {
        throw new ApiError(httpStatus.NOT_FOUND, 'No customer spare stocks found for the given spare parts ID');
    }
    return customerSpareStocks;
};

module.exports = {
    createCustomerSpareStock,
    queryCustomerSpareStocks,
    getCustomerSpareStockById,
    updateCustomerSpareStockById,
    deleteCustomerSpareStockById,
    getAllCustomerSpareStocks,
    findCustomerSpareStockBySparePartsId,
};