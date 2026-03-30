const httpStatus = require('http-status');
const { Region } = require('../../models');
const ApiError = require('../../utils/ApiError');

const createRegion = async (region) => Region.create(region);
const queryRegions = async (filter, options) => Region.paginate ? Region.paginate(filter, options) : Region.find(filter);
const getRegionById = async (id) => Region.findById(id);
const updateRegionById = async (id, updateBody) => {
  const region = await getRegionById(id);
  if (!region) throw new ApiError(httpStatus.NOT_FOUND, 'Region not found');
  Object.assign(region, updateBody);
  await region.save();
  return region;
};
const deleteRegionById = async (id) => {
  const region = await getRegionById(id);
  if (!region) throw new ApiError(httpStatus.NOT_FOUND, 'Region not found');
  await region.remove();
  return region;
};

const getAllRegions = async () => Region.find();

module.exports = {
  createRegion,
  queryRegions,
  getRegionById,
  updateRegionById,
  deleteRegionById,
  getAllRegions,
};
