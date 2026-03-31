const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const pick = require('../../utils/pick');
const { cityService } = require('../../services');
const ApiError = require('../../utils/ApiError');

const createCity = catchAsync(async (req, res) => {
    const city = await cityService.createCity(req.body);
    res.status(httpStatus.CREATED).send({ code: 1, city });
});

const getCities = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['name', 'stateId']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await cityService.queryCities(filter, options);
    res.send({ results: result, code: 1 });
});

const getCityById = catchAsync(async (req, res) => {
    const city = await cityService.getCityById(req.query.id);
    if (!city) {
        throw new ApiError(httpStatus.NOT_FOUND, 'City not found');
    }
    res.send({ city, code: 1 });
});

const updateCity = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body.City;
    const updated = await cityService.updateCityById(id, updateData);
    res.send({ code: 1, data: updated });
});

const deleteCity = catchAsync(async (req, res) => {
    await cityService.deleteCityById(req.query.id);
    res.status(httpStatus.OK).send({ code: 1 });
});

const getAllCities = catchAsync(async (req, res) => {
    const cities = await cityService.getAllCities();
    res.send({ code: 1, data: cities });
});

const getCitiesByStateId = catchAsync(async (req, res) => {
    const { stateId } = req.query;
    if (!stateId) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'State ID is required');
    }
    const cities = await cityService.getCitiesByStateId(stateId);
    res.send({ code: 1, data: cities });
});

module.exports = {
    createCity,
    getCities,
    getCityById,
    updateCity,
    deleteCity,
    getAllCities,
    getCitiesByStateId,
};
