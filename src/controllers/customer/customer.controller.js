const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const pick = require('../../utils/pick');
const { customerService } = require('../../services');
const ApiError = require('../../utils/ApiError');

const createCustomer = catchAsync(async (req, res) => {
    const customer = await customerService.createCustomer(req.body);
    res.status(httpStatus.CREATED).send({ code: 1, customer });
});

const insertMany = catchAsync(async (req, res) => {
    let data = req.body;

    if (!Array.isArray(data)) {
        data = Object.values(data);
    }
    const customer = await customerService.insertManyCustomer(data);
    res.status(httpStatus.CREATED).send({ code: 1, customer });
});

const getCustomers = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['addressTwo', 'contactNumber', 'customerName', 'contactEmail', 'searchText']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await customerService.queryCustomers(filter, options);
    res.send({ results: result });
});

const getCustomerById = catchAsync(async (req, res) => {
    const customer = await customerService.getCustomerById(req.query.id);
    if (!customer) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Customer not found');
    }
    res.send(customer);
});

const updateCustomer = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body;
    const updated = await customerService.updateCustomerById(id, updateData);
    res.send({ code: 1, data: updated });
});

const updateStatus = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body;
    const updated = await customerService.updateStatus(id, updateData);
    res.send({ code: 1, data: updated });
});

const deleteCustomer = catchAsync(async (req, res) => {
    await customerService.deleteCustomerById(req.query.id);
    res.status(httpStatus.OK).send({ code: 1 });
});

const getAllCustomers = catchAsync(async (req, res) => {
    const customers = await customerService.getAllCustomers();
    res.send({ code: 1, data: customers });
});

module.exports = {
    createCustomer,
    getCustomers,
    getCustomerById,
    updateCustomer,
    deleteCustomer,
    getAllCustomers,
    updateStatus,
    insertMany
};
