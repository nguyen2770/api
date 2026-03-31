const httpStatus = require('http-status');
const { RequestIssue, RequestIssueDetail } = require('../../models');
const ApiError = require('../../utils/ApiError');

const generateCode = async () => {
    const date = new Date();
    const dateString = date.toISOString().slice(0, 10).replace(/-/g, '');
    const today = new Date(dateString.slice(0, 4), dateString.slice(4, 6) - 1, dateString.slice(6, 8));
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const count = await RequestIssue.countDocuments({
        createdAt: { $gte: today, $lt: tomorrow },
    });

    return `PDXK-${dateString}-${String(count + 1).padStart(3, '0')}`;
};

const createRequestIssue = async (data, userId) => {
    const { requestIssueDetail, requestIssue } = data
    const code = await generateCode();

    const order = new RequestIssue({ ...requestIssue, code, createdBy: userId, updatedBy: userId });
    const a = await order.save();

    const dataToInsert = requestIssueDetail.map(item => ({
        ...item,
        requestIssue: a._id,
    }));
    const b = await RequestIssueDetail.insertMany(dataToInsert)
    return { a, b };
}



const queryRequestIssue = async (filter, options) => {
    const requestIssue = await RequestIssue.paginate(filter, options);

    return requestIssue;
}

const getRequestIssueById = async (id) => {
    const purchaseOrder = await RequestIssue.findById(id)
    return purchaseOrder;
}


const updateRequestIssueById = async (id, data, userId) => {
    const { requestIssueDetail, requestIssue } = data.payload;

    if (requestIssue) {
        await RequestIssue.findByIdAndUpdate(
            id,
            { ...requestIssue, updatedBy: userId },
        );
    }

    if (requestIssueDetail) {

        await RequestIssueDetail.deleteMany({ requestIssue: id });

        const dataToInsert = requestIssueDetail.map(item => ({
            ...item,
            requestIssue: id,
        }));

         await RequestIssueDetail.insertMany(dataToInsert);
    }

};

const deleteRequestIssueById = async (id) => {
    const requestIssue = await getRequestIssueById(id);
    if (!requestIssue) {
        throw new ApiError(httpStatus.NOT_FOUND, 'requestIssue not found');
    }
    await requestIssue.remove();
    return requestIssue;
}


const getAllRequestIssue = async () => {
    const requestIssue = await RequestIssue.find({ action: "approved" });
    return requestIssue;
}

const getRequestIssueDetailById = async (id) => {
    const res = await RequestIssueDetail.find({ requestIssue: id })
        .populate({ path: "item", select: "code sparePartsName uomId assetModelName asset" })
    return res;
}

const getRequestIssueDetail = async (id) => {
    const res = await RequestIssueDetail.findById(id)
        .populate({ path: "item", select: "code sparePartsName uomId assetModelName asset" })

    return res;
}

const updateAction = async (id, updateBody, userId) => {
    const requestIssue = await getRequestIssueById(id);
    if (!requestIssue) {
        throw new ApiError(httpStatus.NOT_FOUND, 'SuppliesNeed not found');
    }
    Object.assign(requestIssue, updateBody, {updatedBy: userId});
    await requestIssue.save();
    return requestIssue;
};

module.exports = {
    createRequestIssue,
    queryRequestIssue,
    getRequestIssueById,
    updateRequestIssueById,
    deleteRequestIssueById,
    getAllRequestIssue,
    getRequestIssueDetailById,
    getRequestIssueDetail,
    updateAction,
}