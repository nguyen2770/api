const mongoose = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const { SchemaTypes } = mongoose;

const purchaseOrderSchema = mongoose.Schema(
  {
    // Số hợp đồng
    contractNumber: {
      type: String,
      required: true,
      trim: true,
    },

    code: {
      type: String
    },

    // Ngày hợp đồng
    contractDate: {
      type: Date,
    },

    // Ngày cần có hàng
    needDate: {
      type: Date,
    },

    // Ngày gửi PO
    poSentDate: {
      type: Date,
    },

    // Ngày hãng xác nhận
    supplierConfirmDate: {
      type: Date,
    },

    // Ngày hãng có hàng
    supplierReadyDate: {
      type: Date,
    },

    // Ngày hàng về kho
    warehouseReceivedDate: {
      type: Date,
    },

    // Chi nhánh
    branch: {
      type: SchemaTypes.ObjectId,
      ref: 'Branch',
      default: null,
    },

    // Phòng ban
    department: {
      type: SchemaTypes.ObjectId,
      ref: 'Department',
      default: null,
    },
    // Diễn giải / ghi chú
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

    purchaseRequest: {
      type: SchemaTypes.ObjectId,
      ref: 'RequestPurchase',
      default: null,
    },

    isDone: {
      type: Boolean,
      default: false,
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
purchaseOrderSchema.plugin(toJSON);
purchaseOrderSchema.plugin(paginate);

// Đăng ký model
const PurchaseOrder = mongoose.model('PurchaseOrder', purchaseOrderSchema);

module.exports = PurchaseOrder;

