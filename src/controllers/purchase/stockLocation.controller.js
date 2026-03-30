const { stockLocationService } = require("../../services");
const catchAsync = require("../../utils/catchAsync");
const pick = require("../../utils/pick");

const createStockLocation = catchAsync(async (req, res) => {
    const data = await stockLocationService.createStockLocation(req.body);
    res.send({ code: 1, data: data });

});

const queryStockLocation = catchAsync(async (req, res) => {
    const filter = pick(req.query, ["name"]);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    filter.usage = "INTERNAL"
    const result = await stockLocationService.queryStockLocation(filter, options)
    res.send({ code: 1, results: result });

});


const updateStockLocation = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body
    const data = await stockLocationService.updateStockLocation(id, updateData)
    res.send({ code: 1, data: data })
});


module.exports = {
    createStockLocation,
    queryStockLocation,
    updateStockLocation,
}