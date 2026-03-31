const httpStatus = require('http-status');
const { SuppliesNeed, ApprovalTaskModel } = require('../../models');
const { SuppliesNeedSparePart } = require('../../models');
const ApiError = require('../../utils/ApiError');
const { approvedTaskType } = require('../../utils/constant');

const createSuppliesNeed = async (data) => {
    const { suppliesNeed, suppliesNeedSparePart } = data;

    const suppliesNeedDoc = await SuppliesNeed.create(suppliesNeed);

    const suppliesNeedSpareParts = suppliesNeedSparePart.map(item => ({
        ...item,
        suppliesNeed: suppliesNeedDoc._id,
    }));

    const createdSpareParts = await SuppliesNeedSparePart.insertMany(
        suppliesNeedSpareParts
    );

    // thêm yc phê duyệt
    if (suppliesNeedDoc.action === "pendingApproval") {
        await ApprovalTaskModel.create({
            sourceType: approvedTaskType.supplies_need,
            sourceId: suppliesNeedDoc._id || suppliesNeedDoc.id,
            title: "Duyệt phiếu nhu cầu vật tư",
            description: `Mã phiếu ${suppliesNeedDoc.code}`,
            requestUser: data.createdBy,
        })
    }

    return {
        suppliesNeed: suppliesNeedDoc,
        spareParts: createdSpareParts,
    };
};

const querySuppliesNeeds = async (filter, options) => {
    const a = await SuppliesNeed.paginate(filter,
        {
            ...options,
            populate: [
                { path: "branch", select: "name" },
                { path: "department", select: "departmentName" },
                { path: "createdBy", select: "username fullName" }
            ]
        }
    );
    return a;
}

const getSuppliesNeedById = async (id) => {
    const a = await SuppliesNeed.findById(id)
        .populate({ path: "branch", select: "name" })
        .populate({ path: "department", select: "departmentName" })
        .populate({ path: "createdBy", select: "username fullName" });
    return a;
}


const updateSuppliesNeedById = async (id, data, userId) => {
    const { suppliesNeedSparePart, suppliesNeed } = data.payload;

    const updatedSuppliesNeed = await SuppliesNeed.findByIdAndUpdate(
        id,
        { ...suppliesNeed, updatedBy: userId },
    );

    await SuppliesNeedSparePart.deleteMany({ suppliesNeed: id });

    const dataToInsert = suppliesNeedSparePart.map(item => ({
        ...item,
        suppliesNeed: id,
    }));

    const insertedSpareParts = await SuppliesNeedSparePart.insertMany(dataToInsert);
    ;

    return { updatedSuppliesNeed, insertedSpareParts };
};

const deleteSuppliesNeedById = async (id) => {
    const suppliesNeed = await getSuppliesNeedById(id);
    if (!suppliesNeed) {
        throw new ApiError(httpStatus.NOT_FOUND, 'SuppliesNeed not found');
    }
    await suppliesNeed.remove();
    await SuppliesNeedSparePart.deleteMany({ suppliesNeed: id });

    return suppliesNeed;
}

const updateAction = async (id, updateBody, userId) => {
    const suppliesNeed = await getSuppliesNeedById(id);
    if (!suppliesNeed) {
        throw new ApiError(httpStatus.NOT_FOUND, 'SuppliesNeed not found');
    }
    Object.assign(suppliesNeed, updateBody, { updatedBy: userId });
    await suppliesNeed.save();
    return suppliesNeed;
};

const getAllSuppliesNeed = async () => {
    const suppliesNeeds = await SuppliesNeed.find();
    return suppliesNeeds;
}

const getSuppliesNeedDetailById = async (id) => {
    const res = await SuppliesNeedSparePart.find({ suppliesNeed: id })
        .populate({
            path: "sparePart",
            populate: { path: "uomId", select: "uomName" }
        })
        .populate({ path: "asset" })
        .populate({ path: "assetModel" })
        .populate({ path: "assetTypeCategory", select: "name" })
        .populate({ path: "manufacturer" })
        .populate({ path: "uom" });

    return res;
};



module.exports = {
    createSuppliesNeed,
    querySuppliesNeeds,
    getSuppliesNeedById,
    updateSuppliesNeedById,
    deleteSuppliesNeedById,
    updateAction,
    getAllSuppliesNeed,
    getSuppliesNeedDetailById
}