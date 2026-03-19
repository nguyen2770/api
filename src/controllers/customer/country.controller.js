const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const pick = require('../../utils/pick');
const { countryService } = require('../../services');
const ApiError = require('../../utils/ApiError');

const createCountry = catchAsync(async (req, res) => {
  const country = await countryService.createCountry(req.body);
  res.status(httpStatus.CREATED).send({ code: 1, country });
});

const getCountries = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await countryService.queryCountries(filter, options);
  res.send({ results: result });
});

const getCountryById = catchAsync(async (req, res) => {
  const country = await countryService.getCountryById(req.query.id);
  if (!country) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Country not found');
  }
  res.send(country);
});

const updateCountry = catchAsync(async (req, res) => {
  const { id, ...updateData } = req.body.Country;
  const updated = await countryService.updateCountryById(id, updateData);
  res.send({ code: 1, data: updated });
});

const deleteCountry = catchAsync(async (req, res) => {
  await countryService.deleteCountryById(req.query.id);
  res.status(httpStatus.OK).send({ code: 1 });
});

const getAllCountries = catchAsync(async (req, res) => {
  const countries = await countryService.getAllCountries();
  res.send({ code: 1, data: countries });
});

module.exports = {
  createCountry,
  getCountries,
  getCountryById,
  updateCountry,
  deleteCountry,
  getAllCountries,
};