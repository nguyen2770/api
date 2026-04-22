const { StockLocation, StockMove, StockMoveLine } = require('../../models');
const { stockMeta } = require('../../utils/constant');


const findOrGenerateStock = async (code) => {
    let stock = await StockLocation.findOne({ code });

    if (stock) {
        return stock;
    }

    const meta = stockMeta[code];
    if (!meta) {
        throw new Error(`Stock code ${code} is not supported`);
    }

    // tạo mới nếu chưa có
    stock = await StockLocation.create({
        code,
        ...meta,
    });

    return stock;
};

const transferStockAsetModel = async (location, locationDest, data) => {
    const stockMove = await StockMove.create({
        ...data,
        itemType: "AssetModel",
        assetModel: data._id,
        productQty: 1,
        location: location,
        locationDest: locationDest,
    });
    // tạo stock move line từ stock move
    const stockMoveLine = await StockMoveLine.create({
        ...data,
        itemType: "AssetModel",
        stockMove: stockMove._id,
        productQty: 1,
        productDoneQty: 1,
        location: stockMove.location,
        locationDest: stockMove.locationDest,
    });
}


module.exports = {
    findOrGenerateStock,
    transferStockAsetModel
};
