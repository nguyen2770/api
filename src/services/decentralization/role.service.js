const httpStatus = require('http-status');
const { RoleModel, FunctionModel, PermissionModel, RolePermissionModel } = require('../../models');
const ApiError = require('../../utils/ApiError');

const getAllAsset = async () => {
    const roles = await RoleModel.find();
    return roles;
}
const createRole = async (_role) => {
    return RoleModel.create(_role);
};
const getRoleById = async (id) => {
    return RoleModel.findById(id);
};
const updateRoleById = async (id, updateBody) => {
    const role = await getRoleById(id);
    if (!role) {
        throw new ApiError(httpStatus.NOT_FOUND, 'role not found');
    }
    Object.assign(role, updateBody);
    await role.save();
    return role;
};
const deleteRoleById = async (id) => {
    const role = await getRoleById(id);
    if (!role) {
        throw new ApiError(httpStatus.NOT_FOUND, 'role not found');
    }
    await role.remove();
    return role;
};
const getRolePermissions = async (id) => {
    const role = await getRoleById(id);
    const functions = await FunctionModel.aggregate([{
        "$lookup": {
            "from": "permissions",
            "localField": "_id",
            "foreignField": "function",
            "as": "children",
        }
    }]).sort({ sortIndex: 1 });
    const rolePermissions = await RolePermissionModel.find({ role: id });
    if (!role) {
        throw new ApiError(httpStatus.NOT_FOUND, 'role not found');
    }
    return { functions, rolePermissions, role };
};
const updateRolePermissions = async (roleId, permissions) => {
    const role = await getRoleById(roleId);
    if (!role) {
        throw new ApiError(httpStatus.NOT_FOUND, 'role not found');
    }
    // xóa dữ liệu permission cũ
    await RolePermissionModel.deleteMany({ role: roleId });
    const newRolePermissions = []
    if (permissions && permissions.length > 0) {
        permissions.forEach(element => {
            newRolePermissions.push({
                role: roleId,
                permission: element
            })
        });
    }
    await RolePermissionModel.insertMany(newRolePermissions);
    return role;
}
module.exports = {
    getAllAsset,
    createRole,
    getRoleById,
    updateRoleById,
    deleteRoleById,
    getRolePermissions,
    updateRolePermissions
}
