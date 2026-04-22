const { StockLocation, StockMove, StockMoveLine } = require("../../models")

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


const transferStockAsetModel = async (location, locationDest, data) => {
    console.log(data)
    try {

        const stockMove = await StockMove.create({
            ...data,
            itemType: "AssetModel",
            assetModel: data.assetModel,
            assetMaintenance: data._id,
            productQty: 1,
            location: location,
            locationDest: locationDest,
        });
        // tạo stock move line từ stock move
        const stockMoveLine = await StockMoveLine.create({
            ...stockMove,
            itemType: "AssetModel",
            stockMove: stockMove._id,
            assetModel: data.assetModel,
            productQty: 1,
            productDoneQty: 1,
            location: stockMove.location,
            locationDest: stockMove.locationDest,
        });
        console.log(stockMoveLine)

        return true
    } catch (e) {
        console.log(e)
    }


}


module.exports = {
    createStockLocation,
    queryStockLocation,
    updateStockLocation,
    transferStockAsetModel
}