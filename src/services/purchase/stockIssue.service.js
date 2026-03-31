const httpStatus = require('http-status');
const { SparePartDetail, StockIssueDetail, StockLocation, StockMove, StockMoveLine, StockIssue, CompanySettingModel } = require('../../models');
const ApiError = require('../../utils/ApiError');
const { stockLocationCode } = require('../../utils/constant');
const { findOrGenerateStock } = require('../common/stockLocation.service');

const createStockIssue = async (data) => {
    const { stockIssue, stockIssueDetail } = data;

    // 1. Tạo phiếu xuất
    const createdStockIssue = await new StockIssue(stockIssue).save();

    // 2. Tạo chi tiết phiếu xuất
    const detailDocs = await StockIssueDetail.insertMany(
        stockIssueDetail.map((d) => ({
            ...d,
            stockIssue: createdStockIssue._id
        }))
    );


    return { createdStockIssue, detailDocs };
};


const queryStockIssue = async (filter, options) => {
    const stockIssue = await StockIssue.paginate(filter, {
        ...options,
        populate: [
            { path: "branch", select: "name" },
            { path: "department", select: "departmentName" }
        ]
    });


    return stockIssue;
};

const getStockIssueById = async (id) => {
    const stockIssue = await StockIssue.findById(id)
        .populate({ path: "createdBy", select: "fullName" });
    return stockIssue;
};

const updateStockIssueById = async (id, data) => {
    const { stockIssueDetail, stockIssue } = data.payload;

    if (stockIssue) {

        await StockIssue.findByIdAndUpdate(
            id,
            { ...stockIssue },
        );
    }

    if (stockIssueDetail) {

        await StockIssueDetail.deleteMany({ stockIssue: id });

        const dataToInsert = stockIssueDetail.map(item => ({
            ...item,
            stockIssue: id,
        }));

        await StockIssueDetail.insertMany(dataToInsert);
    }


};

const deleteStockIssueById = async (id) => {
    const stockIssue = await getStockIssueById(id);
    if (!stockIssue) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Receipt Purchase not found');
    }
    await stockIssue.remove();
    await StockIssueDetail.deleteMany({ stockIssue: id });

    return stockIssue;
};


const getAllReceiptIssue = async () => {
    const stockIssue = await StockIssue.find();
    return stockIssue;
};

const getCurrentQty = async () => {
    // if (purchaseOrderDetail) {
    //     const totalReceivedQty = await ReceiptPurchaseDetail.aggregate([
    //         { $match: { purchaseOrderDetail:  new mongoose.Types.ObjectId(purchaseOrderDetail.toString) } },
    //         { $group: { _id: null, totalQty: { $sum: "$qty" } } }
    //     ]);

    //     const totalReturnQty = await ReturnToSupplierDetail.aggregate([
    //         { $match: { purchaseOrderDetail: mongoose.Types.ObjectId(purchaseOrderDetail.toString()) } },
    //         { $group: { _id: null, totalQty: { $sum: "$qty" } } }
    //     ]);

    //     const currentTotalReceived = (totalReceivedQty[0] && totalReceivedQty[0].totalQty) || 0;

    //     const currentTotalReturn =  (totalReturnQty[0] && totalReturnQty[0].totalQty) || 0;

    //     const currentTotal = currentTotalReceived + currentTotalReturn;

    //     // Lấy giới hạn từ PurchaseOrderDetail
    //     const poDetail = await PurchaseOrdersDetail.findById(purchaseOrderDetail);
    //     if(!poDetail) {
    //         return null;
    //     }
    //     const orderedQty = poDetail.qty;
    //     const currentQty = orderedQty - currentTotal;

    //     return {currentQty}
    // }
}

const getReceiptStockIssueDetailById = async (id) => {
    const res = await StockIssueDetail.find({ stockIssue: id })
        .populate({
            path: "item uomId",
            select: "code sparePartsName uomId assetModelName asset uomName",
            populate: {
                path: "uomId asset",
                select: "uomName assetName"
            }
        });

    return res;
};

const approve = async (id, data) => {
    try {

        await updateStockIssueById(id, data);
        // tạo các stock move từ stock receipt detail
        const stockReceiptDetails = await StockIssueDetail.find({ stockIssue: id });

        const locationVirtual = await findOrGenerateStock(stockLocationCode.VIRTUAL_MAIN);
        // const locationInternal = await findOrGenerateStock(stockLocationCode.INTERNAL_MAIN);
        const locationVirtualUse = await findOrGenerateStock(stockLocationCode.VIRTUAL_USE);

        let location, locationDest;
        const stockIssue = await StockIssue.findById(id);
        if (stockIssue.exportType == "DISPOSAL") {
            location = stockIssue.locationSrc;
            locationDest = locationVirtual._id;
        } else if (stockIssue.exportType == "USAGE") {
            location = stockIssue.locationSrc;
            locationDest = locationVirtualUse._id;
        }

        for (const detail of stockReceiptDetails) {
            console.log(stockReceiptDetails)
            // tạo stock move từ detail

            const stockMove = await StockMove.create({
                ...detail.toObject(),
                item: detail.item,
                assetModel: detail.itemType == "AssetModel" ? detail.item : null,
                spareParts: detail.itemType == "SpareParts" ? detail.item : null,
                productQty: detail.qty,
                location: location,
                locationDest: locationDest,
                origin: stockIssue.code,
                createdBy: data.updatedBy,
            });
            // tạo stock move line từ stock move
            const stockMoveLine = await StockMoveLine.create({
                ...stockMove.toObject(),
                stockMove: stockMove._id,
                productQty: detail.qty,
                productDoneQty: detail.qty,
                location: stockMove.location,
                locationDest: stockMove.locationDest,
                origin: stockIssue.code,
                createdBy: data.updatedBy,
            });
        }
        return true;
    } catch (e) {
        console.log(e)
    }
};

const createStockIssueFromSpareRequest = async (data, companyId) => {
    const { stockIssue, stockIssueDetail } = data;
    const companySetting = await CompanySettingModel.findOne({ company: companyId });
    stockIssue.locationSrc = companySetting.locationDefault;
    if (companySetting.issueAutoApprovedOnSpareRequest) {
        stockIssue.action = "approved";
    }

    // tạo thông tin phiếu xuất kho
    const createdStockIssue = await new StockIssue(stockIssue).save();

    const detailDocs = await StockIssueDetail.insertMany(
        stockIssueDetail.map((d) => ({
            ...d,
            stockIssue: createdStockIssue._id
        }))
    );

    if (companySetting.issueAutoApprovedOnSpareRequest) {

        // tạo stockmove và stockmoveline

        const locationVirtual = await findOrGenerateStock(stockLocationCode.VIRTUAL_MAIN);
        // const locationInternal = await findOrGenerateStock(stockLocationCode.INTERNAL_MAIN);
        const locationVirtualUse = await findOrGenerateStock(stockLocationCode.VIRTUAL_USE);

        let location, locationDest;

        if (stockIssue.exportType == "DISPOSAL") {
            location = stockIssue.locationSrc;
            locationDest = locationVirtual._id;
        } else if (stockIssue.exportType == "USAGE") {
            location = stockIssue.locationSrc;
            locationDest = locationVirtualUse._id;
        }

        for (const detail of detailDocs) {
            console.log(detailDocs)
            // tạo stock move từ detail

            const stockMove = await StockMove.create({
                ...detail.toObject(),
                item: detail.item,
                assetModel: detail.itemType == "AssetModel" ? detail.item : null,
                spareParts: detail.itemType == "SpareParts" ? detail.item : null,
                productQty: detail.qty,
                location: location,
                locationDest: locationDest,
                origin: stockIssue.code,
                createdBy: data.updatedBy,
            });
            // tạo stock move line từ stock move
            await StockMoveLine.create({
                ...stockMove.toObject(),
                stockMove: stockMove._id,
                productQty: detail.qty,
                productDoneQty: detail.qty,
                location: stockMove.location,
                locationDest: stockMove.locationDest,
                origin: stockIssue.code,
                createdBy: data.updatedBy,
            });
        }
    }
    return { createdStockIssue, detailDocs }

}


module.exports = {
    createStockIssue,
    queryStockIssue,
    deleteStockIssueById,
    updateStockIssueById,
    getReceiptStockIssueDetailById,
    getAllReceiptIssue,
    getCurrentQty,
    approve,
    getStockIssueById,
    createStockIssueFromSpareRequest,
};
