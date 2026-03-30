const httpStatus = require('http-status');
const { InventoryAssetModel, InventoryAssetDepartmentModel, InventoryAssetDepartmentAssetMaintenanceModel, InventoryAssetAssetMaintenanceModel } = require('../../models/inventoryAssetManager');
const { Department, User, AssetMaintenance } = require('../../models');

const ApiError = require('../../utils/ApiError');
const { inventoryAssetStatus, inventoryAssetDepartmentStatus, inventoryAssetDepartmentAssetMaintenanceStatus, inventoryAssetAssetMaintenanceStatus } = require('../../utils/constant');

const createInventoryAsset = async (inventoryAssetCreate, inventoryAssetDepartments) => {
    const inventoryAsset = await InventoryAssetModel.create(inventoryAssetCreate)

    if (inventoryAssetDepartments && inventoryAssetDepartments.length > 0) {
        // eslint-disable-next-line no-plusplus
        for (let i = 0; i < inventoryAssetDepartments.length; i++) {
            const inventoryAssetDepartment = inventoryAssetDepartments[i];
            inventoryAssetDepartment.inventoryAsset = inventoryAsset.id;
            // eslint-disable-next-line no-await-in-loop
            await InventoryAssetDepartmentModel.create(inventoryAssetDepartment);
        }
    }
    return inventoryAsset;
}
const confirmInventoryAsset = async (id) => {
    const _inventoryAsset = await InventoryAssetModel.findById(id)
    if (!_inventoryAsset) {
        throw new ApiError(httpStatus.NOT_FOUND, 'InventoryAsset not found');
    }
    if (_inventoryAsset.status !== inventoryAssetStatus.draft) {
        throw new ApiError(httpStatus.NO_CONTENT, 'Kiểm kê đã được xác nhận trước!');
    }
    Object.assign(_inventoryAsset, { status: inventoryAssetStatus.new });
    // cập nhật assign department
    await InventoryAssetDepartmentModel.updateMany({ inventoryAsset: id }, { status: inventoryAssetDepartmentStatus.assigned });
    // lấy toàn bộ danh sách tài sản tại thời điểm xác nhận kiểm kê
    var inventoryAssetDepartments = await InventoryAssetDepartmentModel.find({ inventoryAsset: id })
    if (inventoryAssetDepartments && inventoryAssetDepartments.length > 0) {
        for (var i = 0; i < inventoryAssetDepartments.length; i++) {
            var _inventoryAssetDepartment = inventoryAssetDepartments[i];
            const assetMaintenances = await AssetMaintenance.find({ department: _inventoryAssetDepartment.department });
            for (let i = 0; i < assetMaintenances.length; i++) {
                const assetMaintenance = assetMaintenances[i];
                // eslint-disable-next-line no-await-in-loop
                // lấy trạng thái
                await InventoryAssetDepartmentAssetMaintenanceModel.create({
                    inventoryAsset: _inventoryAssetDepartment.inventoryAsset,
                    inventoryAssetDepartment: _inventoryAssetDepartment.id,
                    inventoryAssetDate: new Date(),
                    assetMaintenance: assetMaintenance.id,
                    assetModel: assetMaintenance.assetModel,
                    asset: assetMaintenance.asset,
                    status: inventoryAssetDepartmentAssetMaintenanceStatus.not_yet_inventoried
                });
            }
        }
    }
    await _inventoryAsset.save();
    return _inventoryAsset;
}
const confirmInventoryAssetDepartment = async (id) => {
    const _inventoryAssetDepartment = await InventoryAssetDepartmentModel.findById(id)
    if (!_inventoryAssetDepartment) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Inventory Asset Department not found');
    }
    if (_inventoryAssetDepartment.status !== inventoryAssetDepartmentStatus.assigned) {
        throw new ApiError(httpStatus.NO_CONTENT, 'Kiểm kê đã được xác nhận trước!');
    }
    Object.assign(_inventoryAssetDepartment, { status: inventoryAssetDepartmentStatus.accepted });
    await _inventoryAssetDepartment.save();
    return _inventoryAssetDepartment;
}
const deleteInventoryAssetById = async (id) => {
    const _inventoryAsset = await InventoryAssetModel.findById(id);
    if (!_inventoryAsset) {
        throw new ApiError(httpStatus.NOT_FOUND, 'InventoryAsset not found');
    }
    if (_inventoryAsset.status !== inventoryAssetStatus.draft && _inventoryAsset.status !== inventoryAssetStatus.new) {
        throw new ApiError(httpStatus.NO_CONTENT, 'Kiểm kê đã được thực hiện!');
    }
    await InventoryAssetDepartmentModel.deleteMany({ inventoryAsset: id });
    await _inventoryAsset.remove();
    return _inventoryAsset;
}
const sendAssetMaintenances = async (inventoryAssetDepartmentId, inventoryAssetDepartmentAssetMaintenances = []) => {
    const _inventoryAssetDepartment = await InventoryAssetDepartmentModel.findById(inventoryAssetDepartmentId);
    if (!_inventoryAssetDepartment) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Inventory Asset Department not found');
    }

    // xóa dữ liệu cũ
    await InventoryAssetDepartmentAssetMaintenanceModel.deleteMany({ inventoryAssetDepartment: inventoryAssetDepartmentId });
    // cập nhật sang in progress
    await InventoryAssetDepartmentModel.findByIdAndUpdate(
        inventoryAssetDepartmentId, // điều kiện tìm
        { $set: { status: inventoryAssetDepartmentStatus.inProgress } },
        { new: true } // ✅ trả về bản ghi sau khi update
    );
    await InventoryAssetModel.findByIdAndUpdate(
        _inventoryAssetDepartment.inventoryAsset, // điều kiện tìm
        { $set: { status: inventoryAssetStatus.inProgress } },
        { new: true } // ✅ trả về bản ghi sau khi update
    );
    // lấy toàn bộ tài sản đang ở khoa/phòng tại thời điểm kiểm kê
    const assetMaintenances = await AssetMaintenance.find({ department: _inventoryAssetDepartment.department });
    // lưu lại tài sản đang kiểm kê
    if (inventoryAssetDepartmentAssetMaintenances && inventoryAssetDepartmentAssetMaintenances.length > 0) {
        // eslint-disable-next-line no-plusplus
        for (let i = 0; i < inventoryAssetDepartmentAssetMaintenances.length; i++) {
            const inventoryAssetDepartmentAssetMaintenance = inventoryAssetDepartmentAssetMaintenances[i];
            // eslint-disable-next-line no-await-in-loop
            // lấy trạng thái
            var _status = inventoryAssetDepartmentAssetMaintenanceStatus.exist;
            const _assetMaintenanceFind = assetMaintenances.find(am => am.id === inventoryAssetDepartmentAssetMaintenance.assetMaintenance);
            if (_assetMaintenanceFind) {
                _status = inventoryAssetDepartmentAssetMaintenanceStatus.exist;
            } else {
                _status = inventoryAssetDepartmentAssetMaintenanceStatus.does_not_exist;
            }
            await InventoryAssetDepartmentAssetMaintenanceModel.create({
                inventoryAsset: _inventoryAssetDepartment.inventoryAsset,
                inventoryAssetDepartment: _inventoryAssetDepartment.id,
                inventoryAssetDate: new Date(),
                assetMaintenance: inventoryAssetDepartmentAssetMaintenance.assetMaintenance,
                assetModel: inventoryAssetDepartmentAssetMaintenance.assetModel?.id,
                asset: inventoryAssetDepartmentAssetMaintenance.asset?.id,
                status: _status
            });
        }
    }
    // insert các tài sản không được kiểm kê
    var ignorassetMaintenances = assetMaintenances.filter(am => inventoryAssetDepartmentAssetMaintenances.find(iadam => iadam.assetMaintenance !== am.id));
    if (ignorassetMaintenances && ignorassetMaintenances.length > 0) {
        for (let i = 0; i < ignorassetMaintenances.length; i++) {
            const ignorassetMaintenance = ignorassetMaintenances[i];
            // eslint-disable-next-line no-await-in-loop
            // lấy trạng thái
            await InventoryAssetDepartmentAssetMaintenanceModel.create({
                inventoryAsset: _inventoryAssetDepartment.inventoryAsset,
                inventoryAssetDepartment: _inventoryAssetDepartment.id,
                inventoryAssetDate: new Date(),
                assetMaintenance: ignorassetMaintenance.id,
                assetModel: ignorassetMaintenance.assetModel,
                asset: ignorassetMaintenance.asset,
                status: inventoryAssetDepartmentAssetMaintenanceStatus.not_yet_inventoried
            });
        }
    }
    return _inventoryAssetDepartment;
}
const queryInventoryAssets = async (filter, options) => {
    const a = await InventoryAssetModel.paginate(filter, options);
    return a;
}
const getMyInventoryAssets = async (filter, options) => {
    const a = await InventoryAssetModel.paginate(filter, options);
    return a;
}
const getInventoryAssetById = async (id) => {
    const a = await InventoryAssetModel.findById(id)
    return a;
}
const getInventoryAssetDepartmentById = async (id) => {
    const inventoryAssetDepartment = await InventoryAssetDepartmentModel.findById(id).populate([{
        path: 'department'
    }, {
        path: 'user'
    }])
    return inventoryAssetDepartment;
}
const getInventoryAssetDepartmentAssetMaintenancesByIadId = async (id) => {
    const inventoryAssetDepartmentAssetMaintenances = await InventoryAssetDepartmentAssetMaintenanceModel.find({ inventoryAssetDepartment: id }).populate([
        {
            path: 'asset'
        },
        {
            path: 'assetModel'
        }
    ]);
    return inventoryAssetDepartmentAssetMaintenances;
}
const getInventoryAssetDepartmentsByIadId = async (id) => {
    const inventoryAssetDepartments = await InventoryAssetDepartmentModel.find({ inventoryAsset: id });
    var inventoryAssetDepartmentObj = [];
    for (var i = 0; i < inventoryAssetDepartments.length; i++) {
        var itemObj = inventoryAssetDepartments[i].toObject();
        var department = await Department.findById(itemObj.department);
        if (department) itemObj.departmentName = department.departmentName;
        var _user = await User.findById(itemObj.user);
        if (_user) itemObj.fullName = _user.fullName;
        inventoryAssetDepartmentObj.push(itemObj);
    }
    return inventoryAssetDepartmentObj;
}
const updateInventoryAssetById = async (id, inventoryAsset, inventoryAssetDepartments) => {
    const _inventoryAsset = await InventoryAssetModel.findByIdAndUpdate(id, inventoryAsset)
    // xóa dữ liệu cũ
    await InventoryAssetDepartmentModel.deleteMany({ inventoryAsset: id });
    if (inventoryAssetDepartments && inventoryAssetDepartments.length > 0) {
        // eslint-disable-next-line no-plusplus
        for (let i = 0; i < inventoryAssetDepartments.length; i++) {
            const inventoryAssetDepartment = inventoryAssetDepartments[i];
            inventoryAssetDepartment.inventoryAsset = _inventoryAsset.id;
            // eslint-disable-next-line no-await-in-loop
            await InventoryAssetDepartmentModel.create(inventoryAssetDepartment);
        }
    }
    return _inventoryAsset;
}


const updateStatus = async (id, updateBody) => {
    const InventoryAsset = await getInventoryAssetById(id);
    if (!InventoryAsset) {
        throw new ApiError(httpStatus.NOT_FOUND, 'InventoryAsset not found');
    }
    Object.assign(InventoryAsset, updateBody);
    await InventoryAsset.save();
    return InventoryAsset;
};

const getAllInventoryAsset = async () => {
    const InventoryAssets = await InventoryAssetModel.find();
    return InventoryAssets;
}


module.exports = {
    createInventoryAsset,
    confirmInventoryAsset,
    queryInventoryAssets,
    getInventoryAssetById,
    getInventoryAssetDepartmentsByIadId,
    updateInventoryAssetById,
    deleteInventoryAssetById,
    updateStatus,
    getAllInventoryAsset,
    getMyInventoryAssets,
    getInventoryAssetDepartmentById,
    getInventoryAssetDepartmentAssetMaintenancesByIadId,
    confirmInventoryAssetDepartment,
    sendAssetMaintenances
}