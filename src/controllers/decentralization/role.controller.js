const catchAsync = require('../../utils/catchAsync');
const { roleService } = require('../../services');

const getAllRole = catchAsync(async (req, res) => {
    const role = await roleService.getAllAsset();
    res.send({ code: 1, data: role });
});
const createRole = catchAsync(async (req, res) => {
    req.body = {
        ...req.body,
        createdBy: req.user.id,
        updatedBy: req.user.id,
    };
    const role = await roleService.createRole(req.body);
    res.send({ code: 1, data: role });
});
const updateRole = catchAsync(async (req, res) => {
    req.body = {
        ...req.body,
        updatedBy: req.user.id,
    };
    const role = await roleService.updateRoleById(req.params.id, req.body);
    res.send({ code: 1, data: role });
});
const deleteRole = catchAsync(async (req, res) => {
    await roleService.deleteRoleById(req.params.id);
    res.send({ code: 1 });
});
const getRolePermissions = catchAsync(async (req, res) => {
    const { functions, rolePermissions, role } = await roleService.getRolePermissions(req.params.id);
    functions.forEach(_func => {
        _func.children.forEach(_per => {
            _per.checked = rolePermissions.findIndex(r => r.permission.toString() === _per._id.toString()) > -1;
            _per.key = _per._id;
            _per.title = _per.name;
        });
        _func.key = _func._id;
        _func.title = _func.name;
    })
    res.send({ code: 1, functions, role, rolePermissions });
});
const updateRolePermissions = catchAsync(async (req, res) => {
    const role = await roleService.updateRolePermissions(req.params.id, req.body.permissions)
    res.send({ code: 1, role });
});
module.exports = {
    getAllRole,
    createRole,
    updateRole,
    deleteRole,
    getRolePermissions,
    updateRolePermissions
};
