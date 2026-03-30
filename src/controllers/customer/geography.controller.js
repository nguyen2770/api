const catchAsync = require('../../utils/catchAsync');
const { communeService, provinceService } = require('../../services');

const getAllCommunes = catchAsync(async (req, res) => {
    const communes = await communeService.getAllCommunes();
    res.send({ code: 1, data: communes });
});

const getAllCommunesByProvince = catchAsync(async (req, res) => {
    const communes = await communeService.getAllCommunesByProvince(req.query.id);
    res.send({ code: 1, data: communes });
});

const getAllProvinces = catchAsync(async (req, res) => {
    const provinces = await provinceService.getAllProvinces();
    res.send({ code: 1, data: provinces });
});

module.exports = {
    getAllCommunes,
    getAllCommunesByProvince,
    getAllProvinces,
}