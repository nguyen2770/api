
const httpStatus = require('http-status');
const { PurchaseQuotation, PurchaseQuotationDetail, QuotationAttachments } = require('../../models');
const ApiError = require('../../utils/ApiError');


const createPurchaseQuotation = async (data) => {
  const { quotation, quotationDetail, attachments } = data;

  const quotationDoc = new PurchaseQuotation({ ...quotation });
  const a = await quotationDoc.save();

  if (quotationDetail) {
    const detailToInsert = quotationDetail.map(item => ({
      ...item,
      quotation: a._id,
    }));
    await PurchaseQuotationDetail.insertMany(detailToInsert);
  }

  if (attachments) {

    const attachment = attachments.map(item => ({
      ...item,
      quotation: a._id,
    }));

    await QuotationAttachments.insertMany(attachment)
  }


};

const queryPurchaseQuotation = async (filter, options) => {
  const quotations = await PurchaseQuotation.paginate(filter, {
    ...options,
    populate: [
      { path: 'requestPurchase', select: 'code' },

    ],
  });

  return quotations;
};

const getPurchaseQuotationById = async (id) => {
  const quotation = await PurchaseQuotation.findById(id)
    .populate({ path: 'requestPurchase', select: 'code description' })
    .populate({ path: "createdBy", select: "fullName" });
  return quotation;
};

const updatePurchaseQuotationById = async (id, data, userId) => {
  const { quotation, quotationDetail, attachments } = data.payload;

  const updatedQuotation = await PurchaseQuotation.findByIdAndUpdate(id, { ...quotation, updatedBy: userId }, { new: true });

  if (quotationDetail) {
    await PurchaseQuotationDetail.deleteMany({ quotation: id });

    const dataToInsert = quotationDetail.map(item => ({
      ...item,
      quotation: id,
    }));
    await PurchaseQuotationDetail.insertMany(dataToInsert);
  }

  if (attachments) {
    await QuotationAttachments.deleteMany({ quotation: id });

    const dataToInsert = attachments.map(item => ({
      ...item,
      quotation: id,
    }));
    await QuotationAttachments.insertMany(dataToInsert);
  }



  return { updatedQuotation };
};

const deletePurchaseQuotationById = async (id) => {
  const quotation = await getPurchaseQuotationById(id);
  if (!quotation) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Purchase Quotation not found');
  }

  await quotation.remove();
  await PurchaseQuotationDetail.deleteMany({ quotation: id });

  return quotation;
};

// const updatePurchaseQuotationStatus = async (id, updateBody) => {
//   const quotation = await getPurchaseQuotationById(id);
//   if (!quotation) {
//     throw new ApiError(httpStatus.NOT_FOUND, 'Purchase Quotation not found');
//   }

//   Object.assign(quotation, updateBody);
//   await quotation.save();
//   return quotation;
// };

const getAllPurchaseQuotation = async () => {
  const quotations = await PurchaseQuotation.find();
  return quotations;
};

const getPurchaseQuotationDetailByQuotationId = async (id) => {
  const res = await PurchaseQuotationDetail.find({ quotation: id })
    .populate({
      path: "item",
      select: "code sparePartsName uomId assetModelName asset",
      populate: [
        { path: "uomId", select: "uomName" },
        { path: "asset", select: "assetName" }
      ]
    })
    .populate({
      path: 'requestPurchaseDetail',
      select: 'qty unitPrice usagePurpose needDate',
    })
  .populate({
    path: 'uom',
    select: 'uomName',
  });

return res;

};

const getPurchaseQuotation = async (id) => {
  const quotation = await PurchaseQuotation.findById(id)
  const res = await PurchaseQuotationDetail.find({ quotation: id })
    .populate({
      path: "item",
      select: "code sparePartsName uomId assetModelName asset",
      populate: [
        { path: "uomId", select: "uomName" },
        { path: "asset", select: "assetName" }
      ]
    });
  return { ...quotation._doc, items: res };
};

const getPurchaseQuotationDetailById = async (id) => {
  const detail = await PurchaseQuotationDetail.findById(id)
    .populate({
      path: "item",
      select: "code sparePartsName uomId assetModelName asset",
      populate: [
        { path: "uomId", select: "uomName" },
        { path: "asset", select: "assetName" }
      ]
    });
  return detail;
};


const getQuotationInfo = async (requestPurchaseId) => {
  const quotations = await PurchaseQuotation.find({ requestPurchase: requestPurchaseId })
  const quotationWithDetails = await Promise.all(
    quotations.map(async (quotation) => {
      const details = await PurchaseQuotationDetail.find({ quotation: quotation._id })
        .populate({
          path: "item",
          select: "code sparePartsName uomId assetModelName asset",
          populate: [
            { path: "uomId", select: "uomName" },
            { path: "asset", select: "assetName" }
          ]
        });

      const processedDetails = details.map((detail) => ({
        ...detail._doc,
        name: detail.item.sparePartsName || detail.item.assetModelName || '',
      }));

      return {
        ...quotation._doc,
        items: processedDetails,
      };
    })
  );

  return quotationWithDetails;

};

const getQuotationAttachmentByQuotation = async (id) => {
  const quotationAttachment = await QuotationAttachments.find({ quotation: id })
    .populate({ path: "resourceId" });

  return quotationAttachment.map(item => ({
    code: 1,
    extension: item.resourceId.extension,
    resourceId: item.resourceId.id,
    fileName: item.resourceId.fileName,
    resourceType: item.resourceType,
  }));
}



module.exports = {
  createPurchaseQuotation,
  queryPurchaseQuotation,
  getPurchaseQuotationById,
  updatePurchaseQuotationById,
  deletePurchaseQuotationById,
  getAllPurchaseQuotation,
  getPurchaseQuotationDetailByQuotationId,
  getPurchaseQuotationDetailById,
  getQuotationInfo,
  getPurchaseQuotation,
  getQuotationAttachmentByQuotation,
};
