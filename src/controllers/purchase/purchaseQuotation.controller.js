const httpStatus = require('http-status');
const mongoose = require('mongoose');
const pick = require('../../utils/pick');
const catchAsync = require('../../utils/catchAsync');
const { purchaseQuotationService, sequenceService } = require('../../services');
const ApiError = require('../../utils/ApiError');
const { PurchaseQuotationDetail } = require('../../models');

/**
 * Create a new Purchase Quotation
 */
const createPurchaseQuotation = catchAsync(async (req, res) => {
  req.body = {
    ...req.body,
    quotation: {
      ...req.body.quotation,
      createdBy: req.user.id,
      updatedBy: req.user.id,
      code: await sequenceService.generateSequenceCode('PURCHASE_QUOTATION'),
    }
  }
  const quotation = await purchaseQuotationService.createPurchaseQuotation(req.body);
  res.status(httpStatus.CREATED).send({ code: 1, data: quotation });
});

/**
 * Query all Purchase Quotations with filter
 */
const getPurchaseQuotations = catchAsync(async (req, res) => {
  const { code, requestPurchaseCode, startDate, endDate, productName, searchText } = req.query;
  const filter = {};


  if (searchText || (code && code.trim())) {
    const keyword = code || searchText.toString();
    filter.code = { $regex: keyword, $options: 'i' };
  }

  if (startDate && startDate.trim()) {
    filter.createdAt = filter.createdAt || {};
    filter.createdAt.$gte = new Date(startDate);
  }

  if (endDate && endDate.trim()) {
    filter.createdAt = filter.createdAt || {};
    filter.createdAt.$lte = new Date(endDate);
  }

  // Nếu có productName thì tìm danh sách quotation chứa sản phẩm đó
  if (searchText || (productName && productName.trim())) {
    const keyword = productName || searchText.toString();
    const sparePartsDetails = await PurchaseQuotationDetail.find({ itemType: 'SpareParts' })
      .populate({
        path: 'item',
        select: 'sparePartsName',
        match: { sparePartsName: { $regex: keyword, $options: 'i' } },

      });

    const assetDetails = await PurchaseQuotationDetail.find({ itemType: 'AssetModel' })
      .populate({
        path: 'item',
        select: 'asset',
        populate: {
          path: 'asset',
          select: 'assetName',
          match: { assetName: { $regex: keyword, $options: 'i' } },
        },
      });

    const matchedDetails = [
      ...sparePartsDetails.filter(d => d.item),
      ...assetDetails.filter(d => d.item?.asset),
    ];

    const quotationIds = matchedDetails.map(d => d.quotation);
    filter._id = { $in: quotationIds };
  }

  if (searchText) {
    const orConditions = [];

    if (filter.code) {
      orConditions.push({ code: filter.code });
      delete filter.code;
    }

    if (filter._id) {
      orConditions.push({ _id: filter._id });
      delete filter._id;
    }

    if (orConditions.length) {
      filter.$or = orConditions;
    }
  }

  const options = pick(req.query, ['sortBy', 'limit', 'page']);

  const result = await purchaseQuotationService.queryPurchaseQuotation(filter, options);

  if (requestPurchaseCode && requestPurchaseCode.trim()) {
    result.results = result.results.filter(q =>
      q.requestPurchase.code.toLowerCase().includes(requestPurchaseCode.toLowerCase())
    );
  }

  res.send({ results: result, code: 1 });
});

/**
 * Get Purchase Quotation by ID
 */
const getPurchaseQuotationById = catchAsync(async (req, res) => {
  const { id } = req.query;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'ID không hợp lệ');
  }

  const quotation = await purchaseQuotationService.getPurchaseQuotationById(id);
  if (!quotation) {
    throw new ApiError(httpStatus.NOT_FOUND, 'PurchaseQuotation not found');
  }

  res.send({ code: 1, data: quotation });
});
/**
 * Update Purchase Quotation by ID
 */
const updatePurchaseQuotation = catchAsync(async (req, res) => {
  const { id, ...updateData } = req.body;
  const updated = await purchaseQuotationService.updatePurchaseQuotationById(id, { payload: updateData }, req.user._id);
  res.send({ code: 1, data: updated });
});

/**
 * Delete Purchase Quotation by ID
 */
const deletePurchaseQuotation = catchAsync(async (req, res) => {
  await purchaseQuotationService.deletePurchaseQuotationById(req.query.id);
  res.status(httpStatus.OK).send({ code: 1 });
});

/**
 * Update status field of a quotation
 */
const updateStatus = catchAsync(async (req, res) => {
  const { id, ...updateData } = req.body.quotation;
  const updated = await purchaseQuotationService.updatePurchaseQuotationStatus(id, updateData, req.user._id);
  res.send({ code: 1, data: updated });
});

/**
 * Get all quotations (no filter/pagination)
 */
const getAllPurchaseQuotations = catchAsync(async (req, res) => {
  const data = await purchaseQuotationService.getAllPurchaseQuotation();
  res.send({ code: 1, data });
});

/**
 * Get all detail lines of a quotation by quotationId
 */
const getPurchaseQuotationDetailByQuotationId = catchAsync(async (req, res) => {
  const details = await purchaseQuotationService.getPurchaseQuotationDetailByQuotationId(req.query.id);
  res.send({ code: 1, data: details });
});

/**
 * Get detail line of quotation by detail ID
 */
const getPurchaseQuotationDetail = catchAsync(async (req, res) => {
  const detail = await purchaseQuotationService.getPurchaseQuotationDetailById(req.query.id);
  if (!detail) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Quotation detail not found');
  }
  res.send({ code: 1, data: detail });
});

const getQuotationInfo = catchAsync(async (req, res) => {
  const detail = await purchaseQuotationService.getQuotationInfo(req.query.id);
  res.send({ code: 1, data: detail })
})

const getPurchaseQuotation = catchAsync(async (req, res) => {
  const detail = await purchaseQuotationService.getPurchaseQuotation(req.query.id);
  res.send({ code: 1, data: detail })
})

const getQuotationAttachmentByQuotation = catchAsync(async (req, res) => {
  const detail = await purchaseQuotationService.getQuotationAttachmentByQuotation(req.query.id);
  res.send({ code: 1, data: detail })
})

module.exports = {
  createPurchaseQuotation,
  getPurchaseQuotations,
  getPurchaseQuotationById,
  updatePurchaseQuotation,
  deletePurchaseQuotation,
  updateStatus,
  getAllPurchaseQuotations,
  getPurchaseQuotationDetailByQuotationId,
  getPurchaseQuotationDetail,
  getQuotationInfo,
  getPurchaseQuotation,
  getQuotationAttachmentByQuotation
};
