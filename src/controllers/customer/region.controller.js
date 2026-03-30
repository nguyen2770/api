const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const pick = require('../../utils/pick');
const { regionService } = require('../../services');
const ApiError = require('../../utils/ApiError');

const createRegion = catchAsync(async (req, res) => {
  const region = await regionService.createRegion(req.body);
  res.status(httpStatus.CREATED).send({ code: 1, region });
});

const getRegions = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'cityId']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await regionService.queryRegions(filter, options);
  res.send({ results: result });
});

const getRegionById = catchAsync(async (req, res) => {
  const region = await regionService.getRegionById(req.query.id);
  if (!region) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Region not found');
  }
  res.send(region);
});

const updateRegion = catchAsync(async (req, res) => {
  const { id, ...updateData } = req.body.Region;
  const updated = await regionService.updateRegionById(id, updateData);
  res.send({ code: 1, data: updated });
});

const deleteRegion = catchAsync(async (req, res) => {
  await regionService.deleteRegionById(req.query.id);
  res.status(httpStatus.OK).send({ code: 1 });
});

const getAllRegions = catchAsync(async (req, res) => {
  const regions = await regionService.getAllRegions();
  res.send({ code: 1, data: regions });
});

module.exports = {
  createRegion,
  getRegions,
  getRegionById,
  updateRegion,
  deleteRegion,
  getAllRegions,
};