const httpStatus = require('http-status');
const { TaxGroup } = require('../../models');
const ApiError = require('../../utils/ApiError');


const createTaxGroup = async (taxGroup) => {
    const a = await TaxGroup.create(taxGroup)
    return a;
} 

const queryTaxGroups = async (filter, options) => {
    const a =  await TaxGroup.paginate(filter, options);
    return a;
} 

const getTaxGroupById = async (id) => {
    const a = await TaxGroup.findById(id)
    return a;
} 
const updateTaxGroupById = async (id, taxGroup) => {
    const a = await TaxGroup.findByIdAndUpdate(id,taxGroup)
    return a;

} 
const deleteTaxGroupById = async (id) => {
    const taxGroup = await getTaxGroupById(id);
    if (!taxGroup) {
        throw new ApiError(httpStatus.NOT_FOUND, 'taxGroup not found');
    }
    await taxGroup.remove();
    return taxGroup; 
} 

const getAllTaxGroups = async () => {
    const taxGroups = await TaxGroup.find();
    return taxGroups;
}

module.exports = {
    createTaxGroup,
    queryTaxGroups,
    getTaxGroupById,
    updateTaxGroupById,
    deleteTaxGroupById,
    getAllTaxGroups
}