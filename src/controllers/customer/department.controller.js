const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const catchAsync = require('../../utils/catchAsync');
const { departmentService } = require('../../services');
const ApiError = require('../../utils/ApiError');

/**
 * Create a user
 * @type {(function(*, *, *): void)|*}
 */

const createDepartment = catchAsync(async (req, res) => {
    req.body = {
        ...req.body,
        // createdBy: req.user.id,
        // updatedBy: req.user.id,
    };
    const Department = await departmentService.createDepartment(req.body);
    res.status(httpStatus.CREATED).send({ code: 1, Department });
});
const getDepartments = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['departmentName']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await departmentService.queryDepartments(filter, options);
    // exchangeRequests.abc = 123;
    res.send({ results: result });
});

const getDepartmentById = catchAsync(async (req, res) => {
    const Department = await departmentService.getDepartmentById(req.query.id);
    if (!Department) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Department not found');
    }
    res.send(Department);
});

/**
 * Update user by id.
 * @type {(function(*, *, *): void)|*}
 */
const updateDepartment = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body.Department;
    // updateData.updatedBy = req.user.id; // Nếu cần
    const updated = await departmentService.updateDepartmentById(id, updateData);
    res.send({ code: 1, data: updated });
});

/**
 * Delete user by id.
 * @type {(function(*, *, *): void)|*}
 */
const deleteDepartment = catchAsync(async (req, res) => {
    await departmentService.deleteDepartmentById(req.query.id);
    res.status(httpStatus.OK).send({ code: 1 });
});

const updateStatus = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body.Department;
    const updated = await departmentService.updateStatus(id, updateData);
    res.send({ code: 1, data: updated });
});

const getAllDepartment = catchAsync(async (req, res) => {
    const Departments = await departmentService.getAllDepartment();
    res.send({ code: 1, data: Departments });
});

module.exports = {
    createDepartment,
    getDepartments,
    getDepartmentById,
    updateDepartment,
    deleteDepartment,
    updateStatus,
    getAllDepartment,
};
