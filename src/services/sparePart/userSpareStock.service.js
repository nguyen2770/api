const httpStatus = require('http-status');
const { UserSpareStock } = require('../../models');
const ApiError = require('../../utils/ApiError');

const createUserSpareStock = async (userSpareStock) => {
    const createdUserSpareStock = await UserSpareStock.create(userSpareStock);
    return createdUserSpareStock;
};

const queryUserSpareStocks = async (filter, options) => {
    const userSpareStocks = await UserSpareStock.paginate(filter, options);
    return userSpareStocks;
};

const getUserSpareStockById = async (id) => {
    const userSpareStock = await UserSpareStock.findById(id);
    return userSpareStock;
};

const updateUserSpareStockById = async (id, userSpareStockData) => {
    const updatedUserSpareStock = await UserSpareStock.findByIdAndUpdate(id, userSpareStockData, { new: true });
    return updatedUserSpareStock;
};

const deleteUserSpareStockById = async (id) => {
    const userSpareStock = await getUserSpareStockById(id);
    if (!userSpareStock) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User spare stock not found');
    }
    await userSpareStock.remove();
    return userSpareStock;
};

const getAllUserSpareStocks = async () => {
    const userSpareStocks = await UserSpareStock.find();
    return userSpareStocks;
};

const getUserSpareStockBySparePartsId = async (sparePartId) => {
    if (!sparePartId) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Spare parts ID is required');
    }
    const userSpareStock = await UserSpareStock.find({ sparePartId });
    if (!userSpareStock) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User spare stock not found for the given spare parts ID');
    }
    return userSpareStock;
};

module.exports = {
    createUserSpareStock,
    queryUserSpareStocks,
    getUserSpareStockById,
    updateUserSpareStockById,
    deleteUserSpareStockById,
    getAllUserSpareStocks,
    getUserSpareStockBySparePartsId
};