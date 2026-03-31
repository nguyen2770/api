const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const calibrationWorkSchema = new mongoose.Schema(
    {
        calibration: {
            type: SchemaTypes.ObjectId,
            ref: 'Calibration',
            default: null,
            required: true,
        },
        calibrationName: {
            type: String,
            required: true,
        },
        calibrationContract: {
            type: SchemaTypes.ObjectId,
            ref: 'CalibrationContract',
            default: null,
        },
        assetMaintenance: {
            type: SchemaTypes.ObjectId,
            ref: 'AssetMaintenance',
            default: null,
            required: true,
        },
        code: {
            type: String,
        },
        numberNext: {
            type: Number,
        },
        // kiểu dữ liệu
        dateType: {
            type: String,
            enum: ['days', 'weeks', 'months', 'years'],
        },
        groupStatus: {
            type: String,
            default: 'new',
            enum: ['new', 'inProgress', 'overdue', 'upcoming', 'history'],
        },
        status: {
            type: String,
            default: 'new',
            enum: ['new', 'inProgress', 'waitingForAdminApproval', 'completed', 'cancelled', 'reOpen'],
        },
        // ngày làm việc / ngày đi hiệu chuẩn
        startDate: {
            type: Date,
        },
        // lần hiệu chuẩn tiếp thep
        nextInspectionDate: {
            type: Date,
        },
        // hiệu chuẩn cuối cùng gần nhất
        mostRecentCalibration: {
            type: Date,
        },
        // tầm quan trọng / ưu tiên
        importance: {
            type: String,
            enum: ['Low', 'Medium', 'High'],
        },
        createdBy: {
            type: SchemaTypes.ObjectId,
            ref: 'User',
            default: null,
        },
        updatedBy: {
            type: SchemaTypes.ObjectId,
            ref: 'User',
            default: null,
        },
        customer: {
            type: SchemaTypes.ObjectId,
            ref: 'Customer',
            default: null,
        },
        isPassed: {
            type: Boolean,
        },
        note: {
            type: String,
        },
        signature: {
            type: String,
        },
        downtimeHr: {
            type: Number,
            default: 0,
        },
        downtimeMin: {
            type: Number,
            default: 0,
        },
        calibrationTimeHr: {
            // thời gian thực hiện công việc hiệu chuẩn
            type: Number,
            default: 0,
        },
        calibrationTimeMin: {
            type: Number,
            default: 0,
        },
        closeDate: {
            type: Date,
        },
        incidentDeadline: {
            type: Date,
        },
        // Vị trí lúc tạo công việc hiệu chuẩn
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
        radiationSafetyLicenseNumber: {
            type: String, //số giấy phép an toàn bức xạ
        },
        inspectionCertificateNumber: {
            //số giấy kiểm định
            type: String,
        },
    },
    { timestamps: true }
);

// add plugin that converts mongoose to json
calibrationWorkSchema.plugin(toJSON);
calibrationWorkSchema.plugin(paginate);
const CalibrationWork = mongoose.model('CalibrationWork', calibrationWorkSchema);

module.exports = CalibrationWork;
