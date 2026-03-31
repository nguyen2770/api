const { StockLocation } = require("../../models")

const createStockLocation = async (data) => {
    const res = await StockLocation.create(data);
    return res;
};

const updateStockLocation = async (id, data) => {
    const res = await StockLocation.findByIdAndUpdate(id, data);
    return res;
};

const queryStockLocation = async (filter, options) => {
    const res = await StockLocation.paginate(filter, {
        ...options,
        populate: [
            { path: "commune", select: "nameWithType" },
            { path: "province", select: "nameWithType" }
        ]
    });

    return res;
};

module.exports = {
    createStockLocation,
    queryStockLocation,
    updateStockLocation
}