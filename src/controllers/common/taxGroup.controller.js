const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const catchAsync = require('../../utils/catchAsync');
const {TaxGroupService} = require('../../services')
const ApiError = require('../../utils/ApiError');

/**
 * Create a user
 * @type {(function(*, *, *): void)|*}
 */

const createTaxGroup = catchAsync(async (req, res) => {
  

    const TaxGroup = await TaxGroupService.createTaxGroup({ 
        ...req.body,
        createdBy: req.user.id,
        updatedBy: req.user.id,
    });
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
   
    res.status(httpStatus.CREATED).send({ code: 1, TaxGroup });
});

const getTaxGroups = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['name']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await TaxGroupService.queryTaxGroups(filter, options);
    res.send({ results: result, code: 1 });
});

const getTaxGroupById = catchAsync(async (req, res) => {
    const asset = await TaxGroupService.getTaxGroupById(req.query.id);
    if (!asset) {
        throw new ApiError(httpStatus.NOT_FOUND, 'category not found');
    }
    res.send({asset, code: 1});
});

/**
 * Update user by id.
 * @type {(function(*, *, *): void)|*}
 */
const updateTaxGroup = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body.taxGroup;
    // updateData.updatedBy = req.user.id; // Nếu cần
    const updated = await TaxGroupService.updateTaxGroupById(id, updateData);
    res.send({ code: 1, data: updated });
});

/**
 * Delete user by id.
 * @type {(function(*, *, *): void)|*}
 */
const deleteTaxGroup = catchAsync(async (req, res) => {
    await TaxGroupService.deleteTaxGroupById(req.query.id);
    res.status(httpStatus.OK).send({ code: 1 });
});

const getAllTaxGroups = catchAsync(async (req, res) => {
    const taxGroups = await TaxGroupService.getAllTaxGroups();
    res.send({ code: 1, data: taxGroups });
});



module.exports = {
    createTaxGroup,
    getTaxGroups,
    getTaxGroupById,
    updateTaxGroup,
    deleteTaxGroup,
    getAllTaxGroups

};