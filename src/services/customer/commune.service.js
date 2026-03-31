const { CommuneModel } = require('../../models');


const getAllCommunes = async () => CommuneModel.find();

const getAllCommunesByProvince = async (id) => {
  const communes = await CommuneModel.find({ province: id });
  return communes;
}

const getCommuneById = async (id) => CommuneModel.findById(id);


module.exports = {


  getAllCommunes,
  getAllCommunesByProvince,
  getCommuneById,
};
