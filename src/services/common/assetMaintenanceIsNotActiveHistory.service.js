const httpStatus = require('http-status');
const { AssetMaintenanceIsNotActiveHistoryModel, Breakdown } = require('../../models');

const ApiError = require('../../utils/ApiError');
const { assetMaintenanceStatus } = require('../../utils/constant');

const createAssetMaintenanceIsNotActiveHistory = async (data) => {
    return AssetMaintenanceIsNotActiveHistoryModel.create(data);
};

const assetMaintenanceIsNotActiveHistoryByAssetMaintenance = async (assetMaintenanceId) => {
    return AssetMaintenanceIsNotActiveHistoryModel.find({ assetMaintenance: assetMaintenanceId, endDate: null });
};

const updateAssetMaintenanceIsNotActiveHistoryById = async (id, data) => {
    const assetMaintenanceIsNotActiveHistory = await AssetMaintenanceIsNotActiveHistoryModel.findById(id);
    if (!assetMaintenanceIsNotActiveHistory) {
        throw new ApiError(httpStatus.NOT_FOUND, 'assetMaintenanceIsNotActiveHistory not found');
    }
    Object.assign(assetMaintenanceIsNotActiveHistory, data);
    await assetMaintenanceIsNotActiveHistory.save();
    return assetMaintenanceIsNotActiveHistory;
};
const rollbackeAssetMaintenanceIsNotActiveHistory = async (assetMaintenance, _breakdown) => {
    const breakdown = await Breakdown.findById(_breakdown);
    if (!breakdown) {
        throw new ApiError(httpStatus.NOT_FOUND, 'breaddown not found');
    }
    if (breakdown.assetMaintenanceStatus === assetMaintenanceStatus.isNotActive) {
        // cập nhật lại endDate
        await AssetMaintenanceIsNotActiveHistoryModel.findOneAndUpdate(
            {
                assetMaintenance,
                origin: _breakdown,
            },
            {
                $set: {
                    endDate: null,
                },
            }
        );
    } else {
        await AssetMaintenanceIsNotActiveHistoryModel.deleteMany({
            assetMaintenance,
            origin: _breakdown,
        });
    }
    return breakdown;
};
const deleteAssetMaintenanceIsNotActiveHistoryByRes = async (data) => {
    const assetMaintenanceIsNotActiveHistory = await AssetMaintenanceIsNotActiveHistoryModel.findOne(data);
    if (!assetMaintenanceIsNotActiveHistory) {
        throw new ApiError(httpStatus.NOT_FOUND, 'assetMaintenanceIsNotActiveHistory not found');
    }
    await assetMaintenanceIsNotActiveHistory.remove();
    return assetMaintenanceIsNotActiveHistory;
};
const updateAssetMaintenanceIsNotActiveHistoryByBreakdown = async (_breakdown, data, user) => {
    const breakdown = await Breakdown.findById(_breakdown);
    if (!breakdown) {
        throw new Error('breakdown not found');
    }
    let getAssetMaintenanceIsNotActiveHistory = null;
    if (breakdown.assetMaintenanceStatus === assetMaintenanceStatus.isActive) {
        const newData = {
            assetMaintenance: breakdown.assetMaintenance,
            startDate: breakdown.createdAt,
            createdBy: user,
            ...data,
        };
        getAssetMaintenanceIsNotActiveHistory = await AssetMaintenanceIsNotActiveHistoryModel.create(newData);
    } else {
        getAssetMaintenanceIsNotActiveHistory = await AssetMaintenanceIsNotActiveHistoryModel.findOneAndUpdate(
            {
                assetMaintenance: _breakdown.assetMaintenance,
                endDate: null,
            },
            { $set: { ...data } },
            { new: true }
        );
    }
    return getAssetMaintenanceIsNotActiveHistory;
};
module.exports = {
    createAssetMaintenanceIsNotActiveHistory,
    assetMaintenanceIsNotActiveHistoryByAssetMaintenance,
    updateAssetMaintenanceIsNotActiveHistoryById,
    deleteAssetMaintenanceIsNotActiveHistoryByRes,
    updateAssetMaintenanceIsNotActiveHistoryByBreakdown,
    rollbackeAssetMaintenanceIsNotActiveHistory
};
