const { StockLocation } = require('../../models');
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


module.exports = {
    findOrGenerateStock
};
