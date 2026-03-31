const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const { assetMaintenanceSelfDiagnosiService, assetMaintenanceDefectService } = require('../../services');
const ApiError = require('../../utils/ApiError');

/**
 * Create a user
 * @type {(function(*, *, *): void)|*}
 */
const createAssetMaintenanceSelfDiagnosi = catchAsync(async (req, res) => {
    const data = {
        ...req.body,
    };

    const defect = await assetMaintenanceDefectService.getAssetMaintenanceDefectById(data.assetMaintenanceDefectId);
    if (defect) {
        await assetMaintenanceDefectService.updateAssetMaintenanceDefectById(data.assetMaintenanceDefectId, {
            defectTags: data.defectTags,
        });
    }

    const asset = await assetMaintenanceSelfDiagnosiService.createAssetMaintenanceSelfDiagnosi(data);

    if (Array.isArray(data.treeStructure)) {
        await Promise.all(
            data.treeStructure.map(async (child) => {
                const dataw = {
                    ...child,
                    assetMaintenanceSelfDiagnosiId: asset._id, // sửa đúng tên field
                };
                await assetMaintenanceSelfDiagnosiService.createSelfDiagnosi(dataw);
            })
        );
    }
    res.status(httpStatus.CREATED).send({ code: 1, data: asset });
});

const getAssetMaintenanceSelfDiagnosiById = catchAsync(async (req, res) => {
    const asset = await assetMaintenanceSelfDiagnosiService.getAssetMaintenanceSelfDiagnosiById(req.query.id);
    if (!asset) {
        throw new ApiError(httpStatus.NOT_FOUND, 'assetMaintenanceSelfDiagnosiService not found');
    }
    const obj = asset.toObject ? asset.toObject() : asset;
    let selfDiagnosi = [];
    if (assetMaintenanceSelfDiagnosiService.getSelfDiagnosiByIdRes) {
        selfDiagnosi = await assetMaintenanceSelfDiagnosiService.getSelfDiagnosiByIdRes(obj._id);
    }
    res.send({
        code: 1,
        data: {
            ...obj,
            selfDiagnosi,
        },
    });
});
/**
 * Update user by id.
 * @type {(function(*, *, *): void)|*}
 */
const updateAssetMaintenanceSelfDiagnosi = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body.data;
    // updateData.updatedBy = req.user.id; // Nếu cần
    const defect = await assetMaintenanceDefectService.getAssetMaintenanceDefectById(updateData.assetMaintenanceDefectId);
    if (defect) {
        const payload = {
            defectTags: updateData.defectTags,
        };
        await assetMaintenanceDefectService.updateAssetMaintenanceDefectById(updateData.assetMaintenanceDefectId, payload);
    }
    const updated = await assetMaintenanceSelfDiagnosiService.updateAssetMaintenanceSelfDiagnosiById(id, updateData);
    res.send({ code: 1, data: updated });
});

/**
 * Delete user by id.
 * @type {(function(*, *, *): void)|*}
 */
const deleteAssetMaintenanceSelfDiagnosi = catchAsync(async (req, res) => {
    await assetMaintenanceSelfDiagnosiService.deleteAssetMaintenanceSelfDiagnosiById(req.query.id);
    res.status(httpStatus.OK).send({ code: 1 });
});

const updateStatus = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body.data;
    const updated = await assetMaintenanceSelfDiagnosiService.updateStatus(id, updateData);
    res.send({ code: 1, data: updated });
});

const getAllAssetMaintenanceSelfDiagnosi = catchAsync(async (req, res) => {
    const assets = await assetMaintenanceSelfDiagnosiService.getAllAssetMaintenanceSelfDiagnosi();
    res.send({ code: 1, data: assets });
});

const getResById = catchAsync(async (req, res) => {
    const assets = await assetMaintenanceSelfDiagnosiService.getResById(req.query.id);

    // Gán selfDiagnosi cho từng bản ghi
    const dataWithSelfDiagnosi = await Promise.all(
        assets.map(async (asset) => {
            const selfDiagnosis = await assetMaintenanceSelfDiagnosiService.getSelfDiagnosiByIdRes(asset._id);
            const obj = asset.toObject ? asset.toObject() : asset;
            return {
                ...obj, // mở các thuộc tính của asset ra ngoài
                id: obj._id ? obj._id.toString() : undefined, // thêm id dạng string
                selfDiagnosi: selfDiagnosis,
            };
        })
    );

    res.send({ code: 1, data: dataWithSelfDiagnosi });
});

module.exports = {
    createAssetMaintenanceSelfDiagnosi,
    getAssetMaintenanceSelfDiagnosiById,
    updateAssetMaintenanceSelfDiagnosi,
    deleteAssetMaintenanceSelfDiagnosi,
    updateStatus,
    getAllAssetMaintenanceSelfDiagnosi,
    getResById,
};
