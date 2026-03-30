const httpStatus = require('http-status');
const { SuppliesNeedSparePart } = require('../../models');
const ApiError = require('../../utils/ApiError');


const createSuppliesNeedSparePart = async (suppliesNeedSparePart) => {
    const a = await SuppliesNeedSparePart.create(suppliesNeedSparePart)
    return a;
} 

const querySuppliesNeedSpareParts = async (filter, options) => {
    const a = await SuppliesNeedSparePart.paginate(filter, options);
    return a;
} 

const getSuppliesNeedSparePartById = async (id) => {
    const a = await SuppliesNeedSparePart.findById(id)
    return a;
} 
const updateSuppliesNeedSparePartById = async (id, suppliesNeedSparePart) => {
    const a = await SuppliesNeedSparePart.findByIdAndUpdate(id,suppliesNeedSparePart)
    return a;
} 
const deleteSuppliesNeedSparePartById = async (id) => {
    const suppliesNeedSparePart = await getSuppliesNeedSparePartById(id);
    if (!suppliesNeedSparePart) {
        throw new ApiError(httpStatus.NOT_FOUND, 'suppliesNeedSparePart not found');
    }
    await suppliesNeedSparePart.remove();
    return suppliesNeedSparePart; 
}

const updateStatus = async (id, updateBody) => {
    const suppliesNeedSparePart = await getSuppliesNeedSparePartById(id);
    if (!suppliesNeedSparePart) {
        throw new ApiError(httpStatus.NOT_FOUND, 'suppliesNeedSparePart not found');
    }
    Object.assign(suppliesNeedSparePart, updateBody);
    await suppliesNeedSparePart.save();
    return suppliesNeedSparePart;
};

const getAllSuppliesNeedSparePart = async () => {
    const suppliesNeedSpareParts = await SuppliesNeedSparePart.find();
    return suppliesNeedSpareParts;
}

const getSuppliesNeedSparePartBySuppliesNeed = async (id) => {
     const suppliesNeedSpareParts = await SuppliesNeedSparePart.find({suppliesNeed: id});
    return suppliesNeedSpareParts;
}


module.exports = {
    createSuppliesNeedSparePart,
    querySuppliesNeedSpareParts,
    getSuppliesNeedSparePartById,
    updateSuppliesNeedSparePartById,
    deleteSuppliesNeedSparePartById,
    updateStatus,
    getAllSuppliesNeedSparePart,
    getSuppliesNeedSparePartBySuppliesNeed
}