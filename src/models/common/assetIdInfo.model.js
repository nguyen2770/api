const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const assetIdInfoSchema = mongoose.Schema(
    {
        assetMaintenance: {
            type: SchemaTypes.ObjectId,
            default: null,
        },
        assetId: {
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
        },
        location: {
            type: SchemaTypes.ObjectId,
            default: null,
        },
        floorId: {
            type: SchemaTypes.ObjectId,
            default: null,
        },
        departmentId: {
            type: SchemaTypes.ObjectId,
            default: null,
        },
        deviceId: {
            type: SchemaTypes.ObjectId,
            default: null,
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
        is_ble_tracking: {
            type: Boolean,
            default: false, // Có phải thiết bị cho mượn không
        },
        is_qr_tracking: {
            type: Boolean,
            default: false,
        },
        is_rfid_tracking: {
            type: Boolean,
            default: false,
        },
        is_asset_tracking: {
            type: Boolean,
            default: false,
        },
        is_meeting_room: {
            type: Boolean,
            default: false,
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
        salvageValue: {
            type: Number,
            trim: true,
        },
        assetLifespan: {
            type: Number,
            trim: true,
        },
        depreciationBased: {
            type: Number,
        },
        productionCapability: {
            type: String,
            trim: true,
        },
        sum_of_the_years: {
            type: Number,
        },
        depreciationType: {
            type: Number,
        },
        traceId: {
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
        status: {
            type: Boolean,
            default: true, // Trạng thái hoạt động của tài sản
        },
        qrCode: {
            type: String,
            default: null, // Mã QR của tài sản
        },
        qrCodeImage: {
            type: String,
            default: null, // Hình ảnh mã QR của tài sản
        },
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
assetIdInfoSchema.plugin(toJSON);
assetIdInfoSchema.plugin(paginate);

/**
 * @typedef User
 */
const Asset = mongoose.model('AssetIdInfo', assetIdInfoSchema);

module.exports = Asset;
