const httpStatus = require('http-status');
const { City } = require('../../models');
const ApiError = require('../../utils/ApiError');

const createCity = async (city) => City.create(city);
const queryCities = async (filter, options) => City.paginate ? City.paginate(filter, options) : City.find(filter);
const getCityById = async (id) => City.findById(id);
const updateCityById = async (id, updateBody) => {
  const city = await getCityById(id);
  if (!city) throw new ApiError(httpStatus.NOT_FOUND, 'City not found');
  Object.assign(city, updateBody);
  await city.save();
  return city;
};
const deleteCityById = async (id) => {
  const city = await getCityById(id);
  if (!city) throw new ApiError(httpStatus.NOT_FOUND, 'City not found');
  await city.remove();
  return city;
};

const getAllCities = async () => City.find();

const getCitiesByStateId = async (stateId) => {
  if (!stateId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'State ID is required');
  }
  return City.find({ stateId });
}

module.exports = {
  createCity,
  queryCities,
  getCityById,
  updateCityById,
  deleteCityById,
  getAllCities,
  getCitiesByStateId
};
