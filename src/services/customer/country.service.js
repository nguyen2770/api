const httpStatus = require('http-status');
const { Country } = require('../../models');
const ApiError = require('../../utils/ApiError');

const createCountry = async (country) => {
    const a = await Country.create(country);
    return a;
};

const queryCountries = async (filter, options) => {
  const a = await Country.paginate ? Country.paginate(filter, options) : Country.find(filter);
    return a;
};

const getCountryById = async (id) => {
  const a = await Country.findById(id);
  return a;
};

const updateCountryById = async (id, updateBody) => {
  const country = await getCountryById(id);
  if (!country) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Country not found');
  }
  Object.assign(country, updateBody);
  await country.save();
  return country;
};

const deleteCountryById = async (id) => {
  const country = await getCountryById(id);
  if (!country) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Country not found');
  }
  await country.remove();
  return country;
};

const getAllCountries = async () => {
  const a = await Country.find();
  return a;
};

module.exports = {
  createCountry,
  queryCountries,
  getCountryById,
  updateCountryById,
  deleteCountryById,
  getAllCountries,
};
