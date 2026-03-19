const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const pick = require('../../utils/pick');
const { stateService } = require('../../services');
const ApiError = require('../../utils/ApiError');

const createState = catchAsync(async (req, res) => {
  const state = await stateService.createState(req.body);
  res.status(httpStatus.CREATED).send({ code: 1, state });
});

const getStates = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'countryId']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await stateService.queryStates(filter, options);
  res.send({ results: result });
});

const getStateById = catchAsync(async (req, res) => {
  const state = await stateService.getStateById(req.query.id);
  if (!state) {
    throw new ApiError(httpStatus.NOT_FOUND, 'State not found');
  }
  res.send(state);
});

const updateState = catchAsync(async (req, res) => {
  const { id, ...updateData } = req.body.State;
  const updated = await stateService.updateStateById(id, updateData);
  res.send({ code: 1, data: updated });
});

const deleteState = catchAsync(async (req, res) => {
  await stateService.deleteStateById(req.query.id);
  res.status(httpStatus.OK).send({ code: 1 });
});

const getAllStates = catchAsync(async (req, res) => {
  const states = await stateService.getAllStates();
  res.send({ code: 1, data: states });
});

const getStateByContryId = catchAsync(async (req, res) => {
  const { countryId } = req.body;
  if (!countryId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Country ID is required');
  }
  const states = await stateService.getStatesByCountryId(countryId);
  if (!states || states.length === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No states found for this country');
  }
  res.send({ code: 1, data: states });
});

module.exports = {
  createState,
  getStates,
  getStateById,
  updateState,
  deleteState,
  getAllStates,
  getStateByContryId,
};