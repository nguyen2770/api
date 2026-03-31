const httpStatus = require('http-status');
const mongoose = require('mongoose');
const { AssetModelChecklistModel, AssetMaintenance, AssetMaintenanceChecklistModel } = require('../../models');
const ApiError = require('../../utils/ApiError');
const AssetMaintenanceChecklist = require('../../models/common/assetMaintenanceChecklist.model');

const createAssetModelChecklist = async (data) => {
    const create = await AssetModelChecklistModel.create(data);
    return create;
};
const updateAssetModelChecklist = async (assetModelId, checklists, checkReset) => {
    try {
        // 1️⃣ Xóa checklist model cũ
        await AssetModelChecklistModel.deleteMany({ assetModel: assetModelId });
        // 2️⃣ Tạo mới bằng insertMany (thay vì for + create)
        const payload = checklists.map(({ id, ...data }) => ({
            ...data,
            assetModel: assetModelId,
        }));
        const updatedChecklists = await AssetModelChecklistModel.insertMany(payload);
        // 3️⃣ Nếu checkReset = true
        if (checkReset) {
            const assetMaintenances = await AssetMaintenance.find({ assetModel: assetModelId });
            console.log('assetMaintenances', assetMaintenances);
            const assetMaintenanceIds = assetMaintenances.map((a) => a._id);
            // Xóa toàn bộ checklist của các assetMaintenance
            await AssetMaintenanceChecklistModel.deleteMany({ assetMaintenance: { $in: assetMaintenanceIds } });
            // Tạo checklist mới cho tất cả assetMaintenance (bulk 1 lần)
            const bulkInsert = [];
            for (const assetId of assetMaintenanceIds) {
                for (const checklist of updatedChecklists) {
                    bulkInsert.push({
                        assetMaintenance: assetId,
                        assetModel: checklist.assetModel,
                        index: checklist.index,
                        content: checklist.content,
                    });
                }
            }

            if (bulkInsert.length > 0) {
                await AssetMaintenanceChecklistModel.insertMany(bulkInsert);
            }
        }
        return updatedChecklists;
    } catch (error) {
        throw error;
    }
};

const getAssetModelChecklistByRes = async (filter) => {
    const checklists = await AssetModelChecklistModel.find(filter);
    return checklists;
};
module.exports = {
    createAssetModelChecklist,
    updateAssetModelChecklist,
    getAssetModelChecklistByRes,
};
