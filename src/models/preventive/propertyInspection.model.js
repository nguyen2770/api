const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const propertyInspectionSchema = new mongoose.Schema(
    {
        assetMaintenance: {
            type: SchemaTypes.ObjectId,
            ref: 'AssetMaintenance',
            default: null,
        },
        inspectionDate: {
            type: Date,
            default: null,
        },
        note: {
            type: String,
            default: null,
        },
        status: {
            type: String,
            enum: ['waitingForAdminApproval', 'partiallyCompleted', 'completed', 'cancelled'], // gồm các trạng thái: chờ duyệt, hoàn thành một phần, hoàn thành, hủy
            default: null,
        },
        cancelDate: {
            type: Date,
            default: null,
        },
        completeDate: {
            type: Date,
            default: null,
        },
        nameUser: {
            type: String,
            default: null,
        },
        code: {
            type: String,
            default: null,
        },
        // Vị trí lúc tạo kiểm tra tài sản
        province: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Province',
            default: null,
        },
        commune: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Commune',
            default: null,
        },
        branch: {
            type: SchemaTypes.ObjectId,
            ref: 'Branch',
            default: null,
        },
        building: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Building',
            default: null,
        },
        floor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Floor',
            default: null,
        },
        department: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Department',
            default: null,
        },
        addressNote: {
            type: String,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    { timestamps: true }
);

// add plugin that converts mongoose to json
propertyInspectionSchema.plugin(toJSON);
propertyInspectionSchema.plugin(paginate);
const PropertyInspection = mongoose.model('PropertyInspection', propertyInspectionSchema);

module.exports = PropertyInspection;
