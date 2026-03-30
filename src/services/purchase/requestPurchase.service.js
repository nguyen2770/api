const httpStatus = require('http-status');
const mongoose = require('mongoose');
const { RequestPurchase, RequestPurchaseDetail, ApprovalTaskModel } = require('../../models');
const ApiError = require('../../utils/ApiError');
const { approvedTaskType } = require('../../utils/constant');


const createRequestPurchase = async (data) => {
    const { requestPurchase, requestPurchaseDetail } = data;

    const isCompleted = requestPurchaseDetail.length === 0;

    const requestPurchaseDoc = await RequestPurchase.create({
        ...requestPurchase,
        isDone: isCompleted,
    });

    const sanitizeDetailItem = (detail) => {
        const detailData = {
            ...detail,
            requestPurchase: requestPurchaseDoc._id,
        };

        // Xoá field rỗng
        Object.keys(detailData).forEach((key) => {
            if (
                detailData[key] === "" ||
                detailData[key] === undefined ||
                detailData[key] === null
            ) {
                delete detailData[key];
            }
        });

        return detailData;
    };

    const purchaseDetailsData = requestPurchaseDetail.map(sanitizeDetailItem);

    const createdPurchaseDetails =
        await RequestPurchaseDetail.insertMany(purchaseDetailsData);


    // thêm yêu cầu phê duyệt 
    if (requestPurchaseDoc.action === "pendingApproval") {
        await ApprovalTaskModel.create({
            sourceType: approvedTaskType.purchase_request,
            sourceId: requestPurchaseDoc._id || requestPurchaseDoc.id,
            title: "Duyệt phiếu yêu cầu phụ tùng",
            description: `Mã phiếu ${requestPurchaseDoc.code}`,
            requestUser: data.createdBy,
        })
    }


    return {
        requestPurchase: requestPurchaseDoc,
        purchaseDetails: createdPurchaseDetails,
    };
};


const queryRequestPurchases = async (filter, options) => {
    const a = await RequestPurchase.paginate(filter, {
        ...options,
        populate: [
            { path: "branch", select: "name" },
            { path: "department", select: "departmentName" }
        ]
    });
    return a;
}

const getRequestPurchaseById = async (id) => {
    const a = await RequestPurchase.findById(id)
        .populate({ path: "createdBy", select: "fullName" })

    return a;
}


const updateRequestPurchaseById = async (id, data, userId) => {
    const { requestPurchaseDetail, requestPurchase } = data.payload;
    const isDone = (requestPurchaseDetail?.length ?? 0) > 0;

    const updatedRequestPurchase = await RequestPurchase.findByIdAndUpdate(
        id,
        { ...requestPurchase, updatedBy: userId, isDone },
    );

    await RequestPurchaseDetail.deleteMany({ requestPurchase: id });

    const cleanItem = (item) => {
        const cleaned = { ...item, requestPurchase: id };

        // Xoá các trường rỗng ("") hoặc null hoặc undefined
        Object.keys(cleaned).forEach((key) => {
            if (cleaned[key] === "" || cleaned[key] === undefined || cleaned[key] === null) {
                delete cleaned[key];
            }
        });

        return cleaned;
    };

    const dataToInsert = requestPurchaseDetail.map(cleanItem);

    const insertedSpareParts = await RequestPurchaseDetail.insertMany(dataToInsert);

    return { updatedRequestPurchase, insertedSpareParts };
};

const deleteRequestPurchaseById = async (id) => {
    const requestPurchase = await getRequestPurchaseById(id);
    if (!requestPurchase) {
        throw new ApiError(httpStatus.NOT_FOUND, 'requestPurchase not found');
    }
    await requestPurchase.remove();
    await RequestPurchaseDetail.deleteMany({ requestPurchase: id });

    return requestPurchase;
}

const updateStatus = async (id, updateBody, userId) => {
    const requestPurchase = await getRequestPurchaseById(id);
    if (!requestPurchase) {
        throw new ApiError(httpStatus.NOT_FOUND, 'requestPurchase not found');
    }
    Object.assign(requestPurchase, updateBody, { updatedBy: userId });
    await requestPurchase.save();
    return requestPurchase;
};

const getAllRequestPurchase = async () => {
    const requestPurchases = await RequestPurchase.find({ action: "approved", isDone: false });
    return requestPurchases;
}

const getRequestPurchasesDetailById = async (id) => {
    const details = await RequestPurchaseDetail.aggregate([
        {
            $match: { requestPurchase: new mongoose.Types.ObjectId(id) }
        },

        // Join PurchaseOrderDetail theo purchaseRequestDetail
        {
            $lookup: {
                from: "purchaseorderdetails", // collection name
                localField: "_id",
                foreignField: "purchaseRequestDetail",
                as: "requestDetail"
            }
        },

        // Tổng qty đã nhận
        {
            $addFields: {
                totalReceiptQty: {
                    $sum: {
                        $map: {
                            input: "$requestDetail",
                            as: "rd",
                            in: "$$rd.qty"
                        }
                    }
                }
            }

            // $addFields: {
            //     totalReceiptQty: { $sum: "$requestDetail.qty" }
            // }
        },

        // Tính số còn lại
        {
            $addFields: {
                remainQty: { $subtract: ["$qty", "$totalReceiptQty"] }
            }
        },

        // Chỉ lấy những item còn thiếu
        {
            $match: {
                remainQty: { $gt: 0 }
            }
        }
    ]);
    console.log(details)

    // Populate các ref
    return RequestPurchaseDetail.populate(details, [
        {
            path: "sparePart",
            populate: { path: "uomId", select: "uomName" }
        },
        { path: "asset" },
        { path: "assetModel" },
        { path: "assetTypeCategory", select: "name" },
        { path: "manufacturer" },
        { path: "uom", select: "uomName" },
    ]);
};

module.exports = {
    createRequestPurchase,
    queryRequestPurchases,
    getRequestPurchaseById,
    updateRequestPurchaseById,
    deleteRequestPurchaseById,
    updateStatus,
    getAllRequestPurchase,
    getRequestPurchasesDetailById
}