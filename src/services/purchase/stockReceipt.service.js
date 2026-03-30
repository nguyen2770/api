const mongoose = require('mongoose');
const httpStatus = require('http-status');
const { StockReceipt, StockMove, StockMoveLine, StockReceiptDetail, StockLocation, SparePartDetail, SparePart } = require('../../models');
const ApiError = require('../../utils/ApiError');
const { use } = require('passport');
const PurchaseOrderDetail = require('../../models/purchase/purchaseOrdersDetail.model');
const PurchaseOrder = require('../../models/purchase/purchaseOrders.model');
const { findOrGenerateStock } = require('../common/stockLocation.service');
const { stockCode } = require('../../utils/constant');



const createStockReceipt = async (data) => {
    const { stockReceiptDetail, stockReceipt } = data;

    // 1. Tạo StockReceipt mới
    const stockReceiptDoc = new StockReceipt({ ...stockReceipt });
    const savedReceipt = await stockReceiptDoc.save();

    // 2. Chuẩn bị StockReceiptDetail để insert
    const dataToInsert = stockReceiptDetail.map(item => {
        const { _id, ...rest } = item; // loại bỏ _id nếu có
        return { ...rest, stockReceipt: savedReceipt._id };
    });

    // 3. Insert nhiều StockReceiptDetail
    const insertedDetails = await StockReceiptDetail.insertMany(dataToInsert);

    // 4. Nếu có purchaseOrder liên quan → kiểm tra isDone
    if (stockReceipt.purchaseOrder) {
        const purchaseOrderId = mongoose.Types.ObjectId(stockReceipt.purchaseOrder);

        // Lấy toàn bộ detail của purchaseOrder, tính tổng đã nhận
        const poDetails = await PurchaseOrderDetail.aggregate([
            { $match: { purchaseOrder: purchaseOrderId } },
            {
                $lookup: {
                    from: "stockreceiptdetails", // tên collection trong MongoDB
                    localField: "_id",
                    foreignField: "purchaseOrderDetail",
                    as: "receipts"
                }
            },
            {
                $addFields: {
                    totalReceived: { $sum: "$receipts.qty" },
                    remainQty: { $subtract: ["$qty", { $sum: "$receipts.qty" }] }
                }
            }
        ]);

        // Nếu tất cả detail đã nhận đủ → cập nhật isDone = true
        const allDone = poDetails.every(d => d.remainQty <= 0);
        if (allDone) {
            await PurchaseOrder.updateOne({ _id: purchaseOrderId }, { isDone: true });
        }
    }

    return { stockReceipt: savedReceipt, stockReceiptDetails: insertedDetails };
};


const queryStockReceipt = async (filter, options) => {
    const stockReceipt = await StockReceipt.paginate(filter, {
        ...options,
        populate: [
            { path: "branch", select: "name" },
            { path: "department", select: "departmentName" }
        ]
    });

    return stockReceipt;

    // const s = await StockReceipt.find();
    // console.log("s", s);
    // return s;
};

const getStockReceiptById = async (id) => {
    const stockReceipt = await StockReceipt.findById(id)
        .populate({ path: "createdBy purchaseOrder", select: "fullName code" });


    return stockReceipt;
};

const updateStockReceiptById = async (id, data) => {
    const { stockReceiptDetail, stockReceipt, updatedBy } = data.payload;

    let updatedReceipt = null;
    let insertedReceiptDetails = [];

    if (stockReceipt) {
        updatedReceipt = await StockReceipt.findByIdAndUpdate(
            id,
            { ...stockReceipt, updatedBy }
        );
    }

    if (stockReceiptDetail) {
        await StockReceiptDetail.deleteMany({ stockReceipt: id });

        const detailsToInsert = stockReceiptDetail.map(item => ({
            ...item,
            stockReceipt: id,
        }));

        insertedReceiptDetails = await StockReceiptDetail.insertMany(detailsToInsert);
    }

    return {
        updatedReceipt,
        insertedReceiptDetails
    };
};


const deleteStockReceiptById = async (id) => {
    const stockReceipt = await getStockReceiptById(id);
    if (!stockReceipt) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Stock Receipt not found');
    }
    await stockReceipt.remove();
    await StockReceiptDetail.deleteMany({ stockReceipt: id });
    return stockReceipt;
};

// const updateStockReceiptStatus = async (id, updateBody) => {
//     const stockReceipt = await getStockReceiptById(id);
//     if (!stockReceipt) {
//         throw new ApiError(httpStatus.NOT_FOUND, 'Stock Receipt not found');
//     }
//     Object.assign(stockReceipt, updateBody);
//     await stockReceipt.save();
//     return stockReceipt;
// };

const getAllStockReceipt = async () => {
    const stockReceipt = await StockReceipt.find();
    return stockReceipt;
};

// const getCurrentQty = async (purchaseOrderDetail) => {
//     if (purchaseOrderDetail) {
//         const totalReceivedQty = await ReceiptPurchaseDetail.aggregate([
//             { $match: { purchaseOrderDetail: new mongoose.Types.ObjectId(purchaseOrderDetail.toString()) } },
//             { $group: { _id: null, totalQty: { $sum: "$qty" } } }
//         ]);

//         const totalReturnQty = await ReturnToSupplierDetail.aggregate([
//             { $match: { purchaseOrderDetail: mongoose.Types.ObjectId(purchaseOrderDetail.toString()) } },
//             { $group: { _id: null, totalQty: { $sum: "$qty" } } }
//         ]);

//         const currentTotalReceived = (totalReceivedQty[0] && totalReceivedQty[0].totalQty) || 0;
//         const currentTotalReturn = (totalReturnQty[0] && totalReturnQty[0].totalQty) || 0;
//         const currentTotal = currentTotalReceived + currentTotalReturn;

//         const poDetail = await PurchaseOrdersDetail.findById(purchaseOrderDetail);
//         if (!poDetail) {
//             return null;
//         }
//         const orderedQty = poDetail.qty;
//         const currentQty = orderedQty - currentTotal;


//         return { currentQty, orderedQty };
//     }
// };

const getStockReceiptDetailById = async (id) => {
    const res = await StockReceiptDetail.find({ stockReceipt: id })
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


const approveStockReceipt = async (id, data) => {
    try {

        const stockReceipt = await updateStockReceiptById(id, data);
        // tạo các stock move từ stock receipt detail
        const stockReceiptDetails = await StockReceiptDetail.find({ stockReceipt: id });

        const locationVirtual = await findOrGenerateStock(stockCode.VIRTUAL_MAIN);
        // const locationInternal = await findOrGenerateStock(stockCode.INTERNAL_MAIN);
        for (const detail of stockReceiptDetails) {
            // tạo stock move từ detail
            // console.log("detail", detail)
            console.log("data", data)

            const stockMove = await StockMove.create({
                ...detail.toObject(),
                item: detail.item,
                assetModel: detail.itemType == "AssetModel" ? detail.item : null,
                spareParts: detail.itemType == "SpareParts" ? detail.item : null,
                productQty: detail.qty,
                location: locationVirtual._id,
                locationDest: data.payload?.stockReceipt?.locationDest,
                createdBy: data.updatedBy,
                // origin: .code,
            });
            // tạo stock move line từ stock move
            const stockMoveLine = await StockMoveLine.create({
                ...stockMove.toObject(),
                stockMove: stockMove._id,
                productQty: detail.qty,
                productDoneQty: detail.qty,
                location: stockMove.location,
                locationDest: stockMove.locationDest,
                createdBy: data.updatedBy,
            });
        }

        //Tạo sparePartDetail từ các detail thuộc SpareParts
        const sparePartDetails = await Promise.all(
            stockReceipt.insertedReceiptDetails
                .filter((doc) => doc.itemType === "SpareParts")
                .map(async (doc) => {
                    const sparePart = await SparePart.findById(doc.item);

                    return {
                        warehouseReceivedDate: stockReceipt.updatedReceipt.warehouseReceivedDate,
                        supplier: stockReceipt.updatedReceipt.supplier,
                        productionDate: doc.productionDate,
                        sparePart: doc.item,
                        stockReceiptDetail: doc._id,
                        origin: stockReceipt.updatedReceipt.code,
                        createdBy: stockReceipt.updatedReceipt.createdBy,
                        manufacturer: sparePart?.manufacturer,
                    };
                })
        );

        if (sparePartDetails.length > 0) {
            const inserted = await SparePartDetail.insertMany(sparePartDetails);
            const updates = inserted.map((item) => {
                return SparePartDetail.findByIdAndUpdate(
                    item._id,
                    { qrCode: item._id.toString() }
                );
            });

            await Promise.all(updates);
        }

    } catch (e) {
        console.log(e)
    }
};


module.exports = {
    createStockReceipt,
    queryStockReceipt,
    getStockReceiptById,
    updateStockReceiptById,
    deleteStockReceiptById,
    getAllStockReceipt,
    getStockReceiptDetailById,
    approveStockReceipt,
};
