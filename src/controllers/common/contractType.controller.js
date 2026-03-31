const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const catchAsync = require('../../utils/catchAsync');
const { contractTypeService } = require('../../services');
const ApiError = require('../../utils/ApiError');

/**
 * Create a user
 * @type {(function(*, *, *): void)|*}
 */
const createContractType = catchAsync(async (req, res) => {
    req.body = {
        ...req.body,
        // createdBy: req.user.id,
        // updatedBy: req.user.id,
    };
    const contractType = await contractTypeService.createContractType(req.body);
    res.status(httpStatus.CREATED).send({ code: 1, contractType });
});

const getContractTypes = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['contractTypeName', 'contractType']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await contractTypeService.queryContractTypes(filter, options);
    // exchangeRequests.abc = 123;
    res.send({ results: result, code: 1 });
});

const getContractTypeById = catchAsync(async (req, res) => {
    const contractType = await contractTypeService.getContractTypeById(req.query.id);
    if (!contractType) {
        throw new ApiError(httpStatus.NOT_FOUND, 'category not found');
    }
    res.send({contractType, code: 1});
});

/**
 * Update user by id.
 * @type {(function(*, *, *): void)|*}
 */
const updateContractType= catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body.data;
    // updateData.updatedBy = req.user.id; // Nếu cần
    const updated = await contractTypeService.updateContractTypeById(id, updateData);
    res.send({ code: 1, data: updated });
});

/**
 * Delete user by id.
 * @type {(function(*, *, *): void)|*}
 */
const deleteContractType = catchAsync(async (req, res) => {
    await contractTypeService.deleteContractTypeById(req.query.id);
    res.status(httpStatus.OK).send({ code: 1 });
});

const getAllContractType= catchAsync(async (req, res) => {
    const categories = await contractTypeService.getAllContractType();
    res.send({ code: 1, data: categories });
});
module.exports = {
    createContractType,
    getContractTypes,
    getContractTypeById,
    updateContractType,
    deleteContractType,
    getAllContractType,
};
