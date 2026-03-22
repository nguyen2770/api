const mongoose = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const { SchemaTypes } = mongoose;

const StockReceiptSchema = mongoose.Schema(
  {

    code: {
      type: String
    },

    // Ngày hàng về kho
    warehouseReceivedDate: {
      type: Date,
    },
    locationDest: { // kho nhận hàng
      type: mongoose.Schema.Types.ObjectId,
      ref: "StockLocation"
    },
    // Chi nhánh
    branch: {
      type: SchemaTypes.ObjectId,
      ref: 'Branch',
      default: null,
    },
    state: {
      type: String,
      enum: ['pendingApproval', 'approved', 'rejected'],
      default: "pendingApproval",
    },
    comment: {
      type: String,
    },

    // Phòng ban
    department: {
      type: SchemaTypes.ObjectId,
      ref: 'Department',
      default: null,
    },

    description: {
      type: String,
      trim: true,
    },

    // Tên nhà cung cấp
    supplier: {
      type: String,
      trim: true,
    },

    phoneNumber: {
      type: String,
      trim: true,
    },

    address: {
      type: String,
      trim: true,
    },

    purchaseOrder: {
      type: SchemaTypes.ObjectId,
      ref: 'PurchaseOrder',
    },

    // Người tạo
    createdBy: {
      type: SchemaTypes.ObjectId,
      ref: 'User',
      default: null,
    },

    // Người cập nhật
    updatedBy: {
      type: SchemaTypes.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

// Thêm plugin hỗ trợ toJSON và phân trang
StockReceiptSchema.plugin(toJSON);
StockReceiptSchema.plugin(paginate);

// Đăng ký model
const StockReceipt = mongoose.model('StockReceipt', StockReceiptSchema);

module.exports = StockReceipt;

