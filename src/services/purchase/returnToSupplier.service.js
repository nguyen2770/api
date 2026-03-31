const httpStatus = require('http-status');
const mongoose = require('mongoose');
const { ReturnToSupplier, ReturnToSupplierDetail, ReceiptPurchaseDetail, PurchaseOrdersDetail } = require('../../models');
const ApiError = require('../../utils/ApiError');



const generateCode = async () => {
    const date = new Date();
    const dateString = date.toISOString().slice(0, 10).replace(/-/g, '');
    const today = new Date(dateString.slice(0, 4), dateString.slice(4, 6) - 1, dateString.slice(6, 8));
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const count = await ReturnToSupplier.countDocuments({
        createdAt: { $gte: today, $lt: tomorrow },
    });

    return `RTS-${dateString}-${String(count + 1).padStart(3, '0')}`;
};

const createReturnToSupplier = async (data) => {
    const { returnToSupplierDetail, returnToSupplier } = data;
    const code = await generateCode();
    // insert ReturnToSupplier
    const order = new ReturnToSupplier({ ...returnToSupplier, code });
    const a = await order.save();

    // insert ReturnToSupplierDetail
    const dataToInsert = returnToSupplierDetail.map(item => ({
        ...item,
        returnToSupplier: a._id,
    }));

    const b = await ReturnToSupplierDetail.insertMany(dataToInsert);


    return { a, b };
};


const queryReturnToSupplier = async (filter, options) => {
    const returnToSupplier = await ReturnToSupplier.paginate(filter, {
        ...options,
        populate: [
            { path: "branch", select: "name" },
            { path: "department", select: "departmentName" }
        ]
    });


    return returnToSupplier;
};

const getReturnToSupplierById = async (id) => {
    const returnToSupplier = await ReturnToSupplier.findById(id)
        .populate({ path: "createdBy", select: "fullName" });
    return returnToSupplier;
};

const updateReturnToSupplierById = async (id, data, userId) => {
    const { returnToSupplierDetail, returnToSupplier } = data.payload;

    if (returnToSupplier) {
        await ReturnToSupplier.findByIdAndUpdate(
            id,
            { ...returnToSupplier, updatedBy: userId },
        );

    }

    if (returnToSupplierDetail) {
        await ReturnToSupplierDetail.deleteMany({ returnToSupplier: id });
        const dataToInsert = returnToSupplierDetail.map(item => ({
            ...item,
            returnToSupplier: id,
        }));

        await ReturnToSupplierDetail.insertMany(dataToInsert);
    }

};

const deleteReturnToSupplierById = async (id) => {
    const returnToSupplier = await getReturnToSupplierById(id);
    if (!returnToSupplier) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Receipt Purchase not found');
    }
    await returnToSupplier.remove();
    return returnToSupplier;
};


const getAllReturnToSupplier = async () => {
    const returnToSupplier = await ReturnToSupplier.find();
    return returnToSupplier;
};

const getCurrentQty = async (purchaseOrderDetail) => {
    if (purchaseOrderDetail) {
        const totalReceivedQty = await ReceiptPurchaseDetail.aggregate([
            { $match: { purchaseOrderDetail: new mongoose.Types.ObjectId(purchaseOrderDetail.toString()) } },
            { $group: { _id: null, totalQty: { $sum: "$qty" } } }
        ]);

        const totalReturnQty = await ReturnToSupplierDetail.aggregate([
            { $match: { purchaseOrderDetail: mongoose.Types.ObjectId(purchaseOrderDetail.toString()) } },
            { $group: { _id: null, totalQty: { $sum: "$qty" } } }
        ]);

        const currentTotalReceived = (totalReceivedQty[0] && totalReceivedQty[0].totalQty) || 0;
        const currentTotalReturn = (totalReturnQty[0] && totalReturnQty[0].totalQty) || 0;
        const currentTotal = currentTotalReceived - currentTotalReturn;

        const poDetail = await PurchaseOrdersDetail.findById(purchaseOrderDetail);
        if (!poDetail) {
            return null;
        }
        const orderedQty = poDetail.qty;
        const currentQty = currentTotal;


        return { currentQty, orderedQty };
    }
};

const getReturnToSupplierDetailById = async (id) => {
    const res = await ReturnToSupplierDetail.find({ returnToSupplier: id })
        .populate({ path: "item", select: "code sparePartsName uomId assetModelName asset" })

    const withQty = await Promise.all(res.map(async doc => {
        const qtyObj = await getCurrentQty(doc._id);
        const itemType = doc.itemType;
        const itemId = doc.item._id;

        let stockQty = 0;

        if (itemType === 'SpareParts') {
            stockQty = await getSparePartQtyById(itemId);
        } else if (itemType === 'AssetModel') {
            stockQty = await getAssetModelQtyById(itemId);
        }

        return { ...doc.toJSON(), ...qtyObj, stockQty };
    }));

    return withQty;
};


module.exports = {
    createReturnToSupplier,
    queryReturnToSupplier,
    getReturnToSupplierById,
    updateReturnToSupplierById,
    deleteReturnToSupplierById,
    getAllReturnToSupplier,
    getReturnToSupplierDetailById,
    getCurrentQty
};
