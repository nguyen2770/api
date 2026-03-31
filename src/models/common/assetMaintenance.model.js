const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');
const preRemoveHook = require('../../utils/preRemoveHook');
const Preventive = require('../preventive/preventive.model');
const SchedulePreventive = require('../preventive/schedulePreventive.model');
const Breakdown = require('./breakdown.model');

const assetMaintenanceSchema = mongoose.Schema(
    {
        asset: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Asset',
        },
        assetStyle: {
            type: Number,
            default: 1,
            enum: [1, 2, 3],
        },
        branch: {
            type: SchemaTypes.ObjectId,
            ref: 'Branch',
            default: null,
        },
        internalCode: {
            type: String,
            default: null,
        },
        depreciationType: {
            type: String,
            default: 'null',
            required: false,
            enum: [
                'straightLine',
                'doubleDecliningBalance',
                'unitOfProductionDepreciationMethod',
                'sumOfTheYearsDigitsDepreciationMethod',
                'null',
            ],
        },
        depreciationBase: {
            type: String,
            default: 'null',
            required: false,
            enum: ['lifespan', 'percentage', 'null'],
        },
        assetModel: {
            type: SchemaTypes.ObjectId,
            default: null,
            required: true,
            ref: 'AssetModel',
        },
        resource: {
            type: SchemaTypes.ObjectId,
            default: null,
            ref: 'Resource',
        },
        description: {
            type: String,
            trim: true,
        },
        status: {
            type: Boolean,
            default: true,
            required: true,
        },
        salvageValue: {
            type: Number,
            trim: true,
        },
        assetLifespan: {
            type: Number,
            trim: true,
        },
        productionCapability: {
            type: Number,
            trim: true,
        },
        productionCapabilityPerMonth: {
            type: Number,
            trim: true,
        },
        isMovable: {
            type: Boolean,
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
        serial: {
            type: String,
            default: null,
        },
        assetReferenceNumber: {
            type: String,
            default: null,
        },
        assetUser: {
            type: String,
            default: null,
        },
        assetNumber: {
            type: String,
            default: null,
        },
        barcode: {
            type: String,
            default: null,
        },
        blecode: {
            type: String,
            default: null,
        },
        rfidcode: {
            type: String,
            default: null,
        },
        criticality: {
            type: String,
            default: null,
        },
        capacityRating: {
            type: String,
            default: null,
        },
        customer: {
            type: SchemaTypes.ObjectId,
            default: null,
            ref: 'Customer',
        },
        isLoaner: {
            type: Boolean,
            default: false, // Có phải thiết bị cho mượn không
        },
        installationDate: {
            type: Date,
        },
        inChargePerson: {
            type: String,
            trim: true,
            // Người phụ trách
        },
        purchaseDate: {
            type: Date,
        },
        yearOfManufacturing: {
            type: Number,
            trim: true,
        },
        purchaseValue: {
            type: Number,
            trim: true,
        },
        purchaseNumber: {
            type: String,
            trim: true,
        },
        serviceProviderName: {
            type: String,
            trim: true,
        },
        depreciationBased: {
            type: Number,
        },
        sum_of_the_years: {
            type: Number,
        },
        trace: {
            type: String,
        },
        qrCode: {
            type: String,
            default: null, // Mã QR của tài sản
        },
        qrCodeImage: {
            type: String,
            default: null, // Hình ảnh mã QR của tài sản
        },
        latitude: { type: String },
        longitude: { type: String },
        address: { type: String },
        commune: { type: mongoose.Schema.Types.ObjectId, ref: 'Commune', default: null },
        province: { type: mongoose.Schema.Types.ObjectId, ref: 'Province', default: null },
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
        firstInspectionDate: {
            type: Date,
        },
        lifeSpan: {
            type: Number,
        },
        Period: {
            type: Number,
        },
        nextInspectionDate: {
            type: Date,
        },
        resourceImportData: {
            type: SchemaTypes.ObjectId,
            ref: 'ResourceImportData',
            default: null,
        },
        assetModelName: {
            type: String,
        },
        branchName: {
            type: String,
        },
        assetName: {
            type: String,
        },
        customerName: {
            type: String,
        },
        floorName: {
            type: String,
        },
        departmentName: {
            type: String,
        },
        buildingName: {
            type: String,
        },
        manufacturerName: {
            type: String,
        },
        categoryName: {
            type: String,
        },
        assetTypeCategory: {
            type: String,
        },
        subCategoryName: {
            type: String,
        },
        oneQaProcedureUri: {
            type: String,
        },
        fundingSources: {
            // nguồn tài trợ
            type: String,
            // enum: ['1', '2', '3'],
            enum: ['stateBudget', 'socialize', 'otherSources'],
        },
        usageStatus: {
            // đang không sử dụng trường này
            type: Boolean,
            default: true,
        },
        assetStatus: {
            type: String,
            enum: ['ACTIVE', 'PAUSED', 'PENDING_CANCEL', 'PENDING_DISPOSAL', "DISPOSAL" , 'PENDING_RETURN', 'RETURNED'], // đang hoạt động, tạm dừng, chờ huỷ, chờ thanh lý
            default: 'ACTIVE',
        },
        registrationNumber: {
            // số Lưu hành
            type: String,
        },
        parentId: {
            type: SchemaTypes.ObjectId,
            ref: 'AssetMaintenance',
            default: null,
        },
        cancelReason: {
            type: String,
        },
        returnReason: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
assetMaintenanceSchema.plugin(toJSON);
assetMaintenanceSchema.plugin(paginate);

assetMaintenanceSchema.pre(
    'remove',
    preRemoveHook([
        { model: Preventive, field: 'assetMaintenance' },
        { model: SchedulePreventive, field: 'assetMaintenance' },
        { model: Breakdown, field: 'assetMaintenance' },
    ])
);

/**
 * @typedef User
 */
const AssetMaintenance = mongoose.model('AssetMaintenance', assetMaintenanceSchema);

module.exports = AssetMaintenance;
