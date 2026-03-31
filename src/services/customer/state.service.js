const httpStatus = require('http-status');
const { State } = require('../../models');
const ApiError = require('../../utils/ApiError');

const createState = async (state) => State.create(state);
const queryStates = async (filter, options) => State.paginate ? State.paginate(filter, options) : State.find(filter);
const getStateById = async (id) => State.findById(id);
const updateStateById = async (id, updateBody) => {
  const state = await getStateById(id);
  if (!state) throw new ApiError(httpStatus.NOT_FOUND, 'State not found');
  Object.assign(state, updateBody);
  await state.save();
  return state;
};
const deleteStateById = async (id) => {
  const state = await getStateById(id);
  if (!state) throw new ApiError(httpStatus.NOT_FOUND, 'State not found');
  await state.remove();
  return state;
};

const getAllStates = async () => State.find();

const getStatesByCountryId = async (countryId) => {
  if (!countryId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Country ID is required');
  }
  return State.find({ countryId });
}

module.exports = {
  createState,
  queryStates,
  getStateById,
  updateStateById,
  deleteStateById,
  getAllStates,
  getStatesByCountryId
};
