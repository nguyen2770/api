const httpStatus = require('http-status');
const mongoose = require('mongoose');
const { PurchaseOrders, PurchaseOrdersDetail, ReceiptPurchaseDetail, ReturnToSupplierDetail, RequestPurchaseDetail, RequestPurchase } = require('../../models');
const ApiError = require('../../utils/ApiError');
const PurchaseOrderDetail = require('../../models/purchase/purchaseOrdersDetail.model');


const createPurchaseOrders = async (data) => {
    const { purchaseOrdersDetail = [], purchaseOrders = {} } = data;

    // 1. Tạo PurchaseOrder
    const savedOrder = await new PurchaseOrders(purchaseOrders).save();

    // 2. Chuẩn bị detail data
    const detailData = purchaseOrdersDetail.map(({ _id, ...rest }) => ({
        ...rest,
        purchaseOrder: savedOrder._id,
    }));

    // 3. Insert detail
    const insertedDetails = await PurchaseOrdersDetail.insertMany(detailData);

    // 4. Nếu có RequestPurchase liên quan → kiểm tra fulfilment
    if (purchaseOrders.purchaseRequest) {
        const requestId = new mongoose.Types.ObjectId(purchaseOrders.purchaseRequest);

        // Toàn bộ RequestPurchaseDetail
        const requestDetails = await RequestPurchaseDetail.aggregate([
            { $match: { requestPurchase: requestId } },
            {
                $lookup: {
                    from: "purchaseorderdetails",
                    localField: "_id",
                    foreignField: "purchaseRequestDetail",
                    as: "createdOrders"
                }
            },
            {
                $addFields: {
                    totalOrdered: { $sum: "$createdOrders.qty" },
                    remainQty: { $subtract: ["$qty", { $sum: "$createdOrders.qty" }] }
                }
            }
        ]);

        // Nếu tất cả đều đủ số lượng
        const allDone = requestDetails.every(x => x.remainQty <= 0);

        if (allDone) {
            await RequestPurchase.updateOne(
                { _id: requestId },
                { isDone: true }
            );
        }
    }

    return {
        purchaseOrder: savedOrder,
        purchaseOrderDetails: insertedDetails
    };
};


const queryPurchaseOrders = async (filter, options) => {
    const purchaseOrders = await PurchaseOrders.paginate(filter, {
        ...options,
        populate: [
            { path: "branch", select: "name" },
            { path: "department", select: "departmentName" }
        ]
    });

    return purchaseOrders;
}

const getPurchaseOrdersById = async (id) => {
    const purchaseOrder = await PurchaseOrders.findById(id)
        .populate({ path: "createdBy purchaseRequest", select: "fullName code" })
    return purchaseOrder;
}


const updatePurchaseOrdersById = async (id, data, userId) => {
    const { purchaseOrdersDetail = [], purchaseOrders = {} } = data.payload;

    // 1. Update PurchaseOrder
    const updatedOrder = await PurchaseOrders.findByIdAndUpdate(
        id,
        { ...purchaseOrders, updatedBy: userId },
        { new: true }
    );

    // 2. Xóa detail cũ
    await PurchaseOrdersDetail.deleteMany({ purchaseOrder: id });

    // 3. Thêm detail mới
    const detailData = purchaseOrdersDetail.map(({ _id, ...rest }) => ({
        ...rest,
        purchaseOrder: id,
    }));

    const insertedDetails = await PurchaseOrdersDetail.insertMany(detailData);


    // 4. Kiểm tra fulfilment requestPurchase
    if (purchaseOrders.purchaseRequest) {
        const requestId = new mongoose.Types.ObjectId(purchaseOrders.purchaseRequest);

        const requestDetails = await RequestPurchaseDetail.aggregate([
            { $match: { requestPurchase: requestId } },
            {
                $lookup: {
                    from: "purchaseorderdetails",
                    localField: "_id",
                    foreignField: "purchaseRequestDetail",
                    as: "createdOrders"
                }
            },
            {
                $addFields: {
                    totalOrdered: { $sum: "$createdOrders.qty" },
                    remainQty: { $subtract: ["$qty", { $sum: "$createdOrders.qty" }] }
                }
            }
        ]);

        const allDone = requestDetails.every(d => d.remainQty <= 0);

        await RequestPurchase.updateOne(
            { _id: requestId },
            { isDone: allDone }
        );
    }

    return {
        updatedPurchaseOrders: updatedOrder,
        insertedSpareParts: insertedDetails
    };
};

const deletePurchaseOrdersById = async (id) => {
    const purchaseOrders = await getPurchaseOrdersById(id);
    if (!purchaseOrders) {
        throw new ApiError(httpStatus.NOT_FOUND, 'purchaseOrders not found');
    }
    await purchaseOrders.remove();
    await PurchaseOrdersDetail.deleteMany({ purchaseOrder: id });

    return purchaseOrders;
}

const updateStatus = async (id, updateBody, userId) => {
    const purchaseOrders = await getPurchaseOrdersById(id);
    if (!purchaseOrders) {
        throw new ApiError(httpStatus.NOT_FOUND, 'purchaseOrders not found');
    }
    Object.assign(purchaseOrders, updateBody, { updatedBy: userId });
    await purchaseOrders.save();
    return purchaseOrders;
};

const getAllPurchaseOrders = async () => {
    const purchaseOrders = await PurchaseOrders.find({ isDone: false });

    // return purchaseOrders;

    // const result = await PurchaseOrders.aggregate([
    //     {
    //         $lookup: {
    //             from: "purchaseorderdetails",
    //             localField: "_id",
    //             foreignField: "purchaseOrder",
    //             as: "details",
    //         },
    //     },
    //     {
    //         $match: {
    //             $expr: {
    //                 $gt: [
    //                     {
    //                         $size: {
    //                             $filter: {
    //                                 input: "$details",
    //                                 as: "d",
    //                                 cond: { $lt: ["$$d.purchasedQty", "$$d.qty"] }
    //                             }
    //                         }
    //                     },
    //                     0
    //                 ]
    //             }
    //         }
    //     }
    // ]);

    return purchaseOrders;

}

const getPurchaseOrdersDetailById = async (id) => {
    const details = await PurchaseOrderDetail.aggregate([
        {
            $match: { purchaseOrder: new mongoose.Types.ObjectId(id) }
        },

        //Join StockReceiptDetail theo purchaseOrderDetail
        {
            $lookup: {
                from: "stockreceiptdetails",
                localField: "_id",
                foreignField: "purchaseOrderDetail",
                as: "receiptDetails"
            }
        },

        // Tổng qty đã nhận
        {
            $addFields: {
                totalReceiptQty: { $sum: "$receiptDetails.qty" }
            }
        },

        // Tính số còn lại
        {
            $addFields: {
                remainQty: { $subtract: ["$qty", "$totalReceiptQty"] }
            }
        },

        // Chỉ lấy những thằng còn thiếu
        {
            $match: {
                remainQty: { $gt: 0 }
            }
        }
    ]);

    console.log(details)
    // Populate item, uom...
    return PurchaseOrderDetail.populate(details, [
        {
            path: "item",
            select: "code sparePartsName uomId assetModelName asset",
            populate: [
                { path: "uomId", select: "uomName" },
                { path: "asset", select: "assetName" }
            ]
        },
        { path: "uom", select: "uomName" },
    ]);
}

const getPurchaseOrdersDetail = async (id) => {
    // const res = await PurchaseOrdersDetail.findById(id)
    //     .populate({
    //         path: "item",
    //         select: "code sparePartsName uomId assetModelName asset",
    //         populate: [
    //             { path: "uomId", select: "uomName" },
    //             { path: "asset", select: "assetName" }
    //         ]
    //     })
    //     .populate({ path: "uom", select: "uomName" });

    // return res;


    const details = await PurchaseOrderDetail.aggregate([
        {
            $match: { purchaseOrder: new mongoose.Types.ObjectId(id) }
        },

        // Join StockReceiptDetail theo purchaseOrderDetail
        // {
        //     $lookup: {
        //         from: "stockreceiptdetails",
        //         localField: "_id",
        //         foreignField: "purchaseOrderDetail",
        //         as: "receiptDetails"
        //     }
        // },

        // // Tổng qty đã nhận
        // {
        //     $addFields: {
        //         totalReceiptQty: { $sum: "$receiptDetails.qty" }
        //     }
        // },

        // // Tính số còn lại
        // {
        //     $addFields: {
        //         remainQty: { $subtract: ["$qty", "$totalReceiptQty"] }
        //     }
        // },

        // Chỉ lấy những thằng còn thiếu
        // {
        //     $match: {
        //         remainQty: { $gt: 0 }
        //     }
        // }
    ]);

    console.log(details)
    // Populate item, uom...
    return PurchaseOrderDetail.populate(details, [
        {
            path: "item",
            select: "code sparePartsName uomId assetModelName asset",
            populate: [
                { path: "uomId", select: "uomName" },
                { path: "asset", select: "assetName" }
            ]
        },
        { path: "uom", select: "uomName" },
    ]);
};






module.exports = {
    createPurchaseOrders,
    queryPurchaseOrders,
    getPurchaseOrdersById,
    updatePurchaseOrdersById,
    deletePurchaseOrdersById,
    updateStatus,
    getAllPurchaseOrders,
    getPurchaseOrdersDetailById,
    getPurchaseOrdersDetail,

}