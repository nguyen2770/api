const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const assetMaintenanceLocationHistorySchema = mongoose.Schema(
    {
        assetMaintenance: {
            type: SchemaTypes.ObjectId,
            ref: 'AssetMaintenance',
            default: null,
        },
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Customer',
            default: null
        },
        commune: { type: mongoose.Schema.Types.ObjectId, ref: 'Commune', default: null },
        province: { type: mongoose.Schema.Types.ObjectId, ref: 'Province', default: null },
        building: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Building',
            default: null
        },
        floor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Floor',
            default: null
        },
        department: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Department',
            default: null
        },
        branch: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Branch',
            default: null
        },
        addressNote: {
            type: String,
        },
        oldCustomer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
        oldCommune: { type: mongoose.Schema.Types.ObjectId, ref: 'Commune', default: null },
        oldProvince: { type: mongoose.Schema.Types.ObjectId, ref: 'Province', default: null },
        oldBuilding: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Building',
            default: null
        },
        oldFloor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Floor',
            default: null
        },
        oldDepartment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Department',
            default: null
        },
        oldBranch: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Branch',
            default: null
        },
        oldAddressNote: {
            type: String,
        },
        resources: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Resource',
            }
        ],
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        }
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
assetMaintenanceLocationHistorySchema.plugin(toJSON);
assetMaintenanceLocationHistorySchema.plugin(paginate);

/**
 * @typedef User
 */
const AssetMaintenanceLocationHistory = mongoose.model('AssetMaintenanceLocationHistory', assetMaintenanceLocationHistorySchema);

module.exports = AssetMaintenanceLocationHistory;
