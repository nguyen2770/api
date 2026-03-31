const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const breakdownSchema = new mongoose.Schema(
    {
        assetMaintenance: {
            type: SchemaTypes.ObjectId,
            ref: 'AssetMaintenance',
            default: null,
        },
        serviceCategory: {
            type: SchemaTypes.ObjectId,
            ref: 'ServiceCategory',
            default: null,
        },
        service: {
            type: SchemaTypes.ObjectId,
            ref: 'Service',
            default: null,
        },
        schedulePreventiveTaskItem: {
            type: SchemaTypes.ObjectId,
            ref: 'SchedulePreventiveTaskItem',
            default: null,
        },
        schedulePreventiveTask: {
            type: SchemaTypes.ObjectId,
            ref: 'SchedulePreventiveTask',
            default: null,
        },
        repairContract: {
            // bỏ không dùng nữa - gắn cho từng assignUser
            type: SchemaTypes.ObjectId,
            ref: 'RepairContract',
            default: null,
        },
        code: {
            type: String,
        },
        subServiceCategory: {
            type: SchemaTypes.ObjectId,
            ref: 'ServiceSubCategory',
            default: null,
        },
        serviceType: {
            type: String,
            enum: ['asset-based-ticket'],
        },
        priorityLevel: {
            type: String,
            enum: ['immediate', 'emergent', 'urgent', 'semiUrgent', 'nonUrgent'],
        },
        ticketStatus: {
            type: String,
            default: 'new',
            enum: ['new', 'inProgress', 'cloesed', 'overdue', 'completed'],
        },
        status: {
            type: String,
            default: 'new',
            enum: [
                'new', // mưới
                'assigned', // phan công
                'accepted', //chấp nhận
                'rejected', // từ chối
                'inProgress', // đang tiến hành
                'completed', // trường này tạm thời chưa dùng đến
                'cancelled',
                'replacement',
                'experimentalFix',
                'WWA', // khi tất cả kxy sư hoàn thành công việc sẽ tự động chuyển sang trạng thái này
                'cloesed',
                'reopen',
                'submitted',
            ],
        },
        breakdownDefect: {
            type: SchemaTypes.ObjectId,
            ref: 'AssetModelFailureType',
            default: null,
        },
        defectDescription: {
            type: String,
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
        reasonReopen: {
            type: String,
            default: null,
        },
        incidentDeadline: {
            type: Date,
        },
        reasonCancel: {
            type: String,
            default: null,
        },
        closingDate: {
            type: Date,
        },
        breakdownAssignUsers: [
            {
                type: SchemaTypes.ObjectId,
                ref: 'BreakdownAssignUser',
            },
        ],
        customer: {
            type: SchemaTypes.ObjectId,
            ref: 'Customer',
        },
        closeSignature: {
            type: String,
        },
        // thời gian hồi đấp
        responseTime: {
            type: Date,
        },
        // trạng thái tài sản
        assetMaintenanceStatus: {
            type: String,
            enum: ['isNotActive', 'isActive'],
            default: 'isNotActive',
        },
        downTimeMilis: {
            type: Number,
            default: 0,
        },
        userNameSubmitProblem: {
            type: String,
        },
        calibrationWorkAssignUser: {
            type: SchemaTypes.ObjectId,
            ref: 'CalibrationWorkAssignUser',
            default: null,
        },
        completedDate: {
            type: Date,
        },
        propertyInspection: {
            type: SchemaTypes.ObjectId,
            ref: 'PropertyInspection',
            default: null,
        },
        // Vị trí lúc tạo sự cố
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
    },
    { timestamps: true }
);

// add plugin that converts mongoose to json
breakdownSchema.plugin(toJSON);
breakdownSchema.plugin(paginate);
const Breakdown = mongoose.model('Breakdown', breakdownSchema);

module.exports = Breakdown;
