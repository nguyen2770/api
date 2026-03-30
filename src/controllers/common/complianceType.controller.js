const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const catchAsync = require('../../utils/catchAsync');
const { complianceTypeService } = require('../../services');
const ApiError = require('../../utils/ApiError');

/**
 * Create a user
 * @type {(function(*, *, *): void)|*}
 */
const createComplianceType = catchAsync(async (req, res) => {
    req.body = {
        ...req.body,
        // createdBy: req.user.id,
        // updatedBy: req.user.id,
    };
    const complianceType = await complianceTypeService.createComplianceType(req.body);
    res.status(httpStatus.CREATED).send({ code: 1, complianceType });
});

const getComplianceTypes = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['complianceTypeName', 'complianceType']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await complianceTypeService.queryComplianceTypes(filter, options);
    // exchangeRequests.abc = 123;
    res.send({ results: result, code: 1 });
});

const getComplianceTypeById = catchAsync(async (req, res) => {
    const complianceType = await complianceTypeService.getComplianceTypeById(req.query.id);
    if (!complianceType) {
        throw new ApiError(httpStatus.NOT_FOUND, 'category not found');
    }
    res.send({ code: 1, complianceType });
});

/**
 * Update user by id.
 * @type {(function(*, *, *): void)|*}
 */
const updateComplianceType = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body.data;
    // updateData.updatedBy = req.user.id; // Nếu cần
    const updated = await complianceTypeService.updateComplianceTypeById(id, updateData);
    res.send({ code: 1, data: updated });
});

/**
 * Delete user by id.
 * @type {(function(*, *, *): void)|*}
 */
const deleteComplianceType = catchAsync(async (req, res) => {
    await complianceTypeService.deleteComplianceTypeById(req.query.id);
    res.status(httpStatus.OK).send({ code: 1 });
});

const getAllComplianceType = catchAsync(async (req, res) => {
    const complianceTypes = await complianceTypeService.getAllComplianceType();
    res.send({ code: 1, data: complianceTypes });
});
module.exports = {
    createComplianceType,
    getComplianceTypes,
    getComplianceTypeById,
    updateComplianceType,
    deleteComplianceType,
    getAllComplianceType,
};
