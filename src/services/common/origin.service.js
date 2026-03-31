const { OriginModel } = require('../../models');


const createOrigin = async (data) => {
    return OriginModel.create(data);
};


const getOriginById = async (id) => {
    return OriginModel.findById(id);
};


const getAllOrigin = async () => {
    const originModels = await OriginModel.find();
    return originModels;
};
module.exports = {
    getOriginById,
    createOrigin,
    getAllOrigin,
};
