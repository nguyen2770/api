const mongoose = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const inventoryAssetDepartmentSchema = mongoose.Schema(
    {
        inventoryAsset: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'InventoryAsset',
            default: null,
        },
        department: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'Department',
            default: null,
        },
        assignDate: {
            type: Date,
        },
        confirmDate: {
            type: Date,
            default: null,
        },
        cancelConfirmDate: {
            type: Date,
            default: null,
        },
        status: {
            type: String,
            default: 'draft',
            enum: [
                'draft',
                'assigned',
                'accepted',
                'cancel',
                'inProgress',
                'pending_approval',
                'approved',
                'close',
            ],
        },
        reasonCancelConfirm: {
            type: String,
        },
        signature: {
            type: String,
        },
        user: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'User',
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
inventoryAssetDepartmentSchema.plugin(toJSON);
inventoryAssetDepartmentSchema.plugin(paginate);

/**
 * @typedef User
 */
const InventoryAssetDepartment = mongoose.model('InventoryAssetDepartment', inventoryAssetDepartmentSchema);

module.exports = InventoryAssetDepartment;
