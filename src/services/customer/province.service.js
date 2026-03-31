const { ProvinceModel } = require('../../models');

const getAllProvinces = async () => ProvinceModel.find();
const getProvinceById = async (id) => ProvinceModel.findById(id);

module.exports = {
    getAllProvinces,
    getProvinceById,
};
