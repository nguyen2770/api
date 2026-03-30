const httpStatus = require('http-status');
const mongoose = require('mongoose');
const pick = require('../../utils/pick');
const ApiError = require('../../utils/ApiError');
const catchAsync = require('../../utils/catchAsync');
const {
    userService,
    breakdownAssignUserService,
    schedulePreventiveService,
    calibrationWorkService,
} = require('../../services');

const createUser = catchAsync(async (req, res) => {
    req.body = {
        ...req.body,
        // createdBy: req.user.id,
        // updatedBy: req.user.id,
        company: req.body.company || req.company.id,
        _id: new mongoose.Types.ObjectId(req.body.id),
    };
    if (req.body.role) {
        req.body.role = new mongoose.Types.ObjectId(req.body.role);
    }
    const user = await userService.createUser(req.body);
    res.status(httpStatus.CREATED).send(user);
});

/**
 * Get users list.
 * @type {(function(*, *, *): void)|*}
 */
const getUsers = catchAsync(async (req, res) => {
    const { branch, department, role } = req.query;
    const filter = pick(req.query, ['fullName', 'contactNo', 'email', 'username', 'searchText']);
    if (branch && branch.trim()) {
        filter.branch = new mongoose.Types.ObjectId(branch);
    }

    if (department && department.trim()) {
        filter.department = new mongoose.Types.ObjectId(department);
    }

    if (role && role.trim()) {
        filter.role = new mongoose.Types.ObjectId(role);
    }
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await userService.queryUsers(filter, options);
    if (result && Array.isArray(result.results)) {
        result.results = await Promise.all(
            result.results.map(async (user) => {
                const breakdownAssignUserCount = await breakdownAssignUserService.getTotalBreakdownAssignUserByUserId(
                    user._id
                );
                const schedulePreventiveTaskAssignUser =
                    await schedulePreventiveService.getTotalSchedulePreventiveTaskAssignUserByUser(user._id);
                const calibrationWorkAssignUserByUser = await calibrationWorkService.getCalibrationWorkAssignUserByUser(
                    user._id
                );
                return {
                    ...user.toJSON(),
                    breakdownAssignUserCount,
                    schedulePreventiveTaskAssignUser,
                    calibrationWorkAssignUserByUser,
                };
            })
        );
    }
    res.send({ ...result, code: 1 });
});

/**
 * Get user by id.
 * @type {(function(*, *, *): void)|*}
 */
const getUserById = catchAsync(async (req, res) => {
    const User = await userService.getUserById(req.params.userId);
    if (!User) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    res.send({ User, code: 1 });
});
const getUserByIdPopulate = catchAsync(async (req, res) => {
    const User = await userService.getUserByIdPopulate(req.params.userId);
    if (!User) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    res.send({ code: 1, User });
});
/**
 * Update user by id.
 * @type {(function(*, *, *): void)|*}
 */
const updateUser = catchAsync(async (req, res) => {
    req.body = {
        ...req.body,
        updatedBy: req.user.id,
    };
    const user = await userService.updateUserById(req.params.userId, req.body);
    res.send({ code: 1, user });
});

/**
 * Delete user by id.
 * @type {(function(*, *, *): void)|*}
 */

const deleteUser = catchAsync(async (req, res) => {
    await userService.deleteUserById(req.params.userId);
    res.status(httpStatus.NO_CONTENT).send();
});

const updateStatus = catchAsync(async (req, res) => {
    const { userId, ...updateData } = req.body.User;
    const updated = await userService.updateStatus(userId, updateData);
    res.send({ code: 1, data: updated });
});

const getAllUser = catchAsync(async (req, res) => {
    const users = await userService.getAllUser();
    res.send({ code: 1, data: users });
});

const updateUserBranchs = catchAsync(async (req, res) => {
    const { userBranchs } = req.body;
    const users = await userService.updateUserBranchs(req.params.userId, userBranchs);
    res.send({ code: 1, data: users });
});
const updateCompanySetting = catchAsync(async (req, res) => {
    const { companySetting } = req.body;
    const _companySetting = await userService.updateCompanySetting(req.company, companySetting);
    res.send({ code: 1, data: _companySetting });
});
const getUserBranchs = catchAsync(async (req, res) => {
    const userBranchs = await userService.getUserBranchs(req.params.userId);
    res.send({ code: 1, data: userBranchs });
});
const verifyApp = catchAsync(async (req, res) => {
    const { deviceToken } = req.body;
    const _deviceMobile = await userService.verifyApp(deviceToken, req.user.id);
    if (_deviceMobile) {
        res.send({ code: 1, data: _deviceMobile });
    } else {
        res.send({ code: 0 });
    }
});
const saveDeviceMobile = catchAsync(async (req, res) => {
    const { deviceMobile } = req.body;
    const _deviceMobile = await userService.saveDeviceMobile(deviceMobile);
    res.send({ code: 1, data: _deviceMobile });
});
const getPermissions = catchAsync(async (req, res) => {
    const permissions = await userService.getPermisisons(req.user.id);
    res.send({ code: 1, data: permissions });
});
const getDataUser = catchAsync(async (req, res) => {
    const permissions = await userService.getPermisisons(req.user.id);
    const userBranchs = await userService.getUserBranchs(req.user.id);
    const companySetting = await userService.getCompanySetting(req.company.id);
    res.send({
        code: 1,
        data: {
            userBranchs,
            permissions,
            companySetting,
        },
    });
});
const getPermissisonByUsers = catchAsync(async (req, res) => {
    const permissions = await userService.getPermissisonByUsers(req.user.id);
    //lưu thời gian đăng nhập lần cuối
    await userService.updateUserById(req.user.id, { lastLoginTime: new Date() });

    res.send({ code: 1, data: permissions });
});
const getCompanyByCode = catchAsync(async (req, res) => {
    const company = await userService.getCompanyByCode(req.params.code);
    res.send({ code: 1, company });
});
const uploadUserExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.send({ code: 0, message: 'Not file' });
        }
        const result = await userService.uploadUserExcel(req.file.path, req.file);
        return res.send({ code: 1, result });
    } catch (error) {
        return res.send({ code: 0, message: error.message || 'Tải file lên không thành công' });
    }
};
module.exports = {
    createUser,
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    getAllUser,
    updateStatus,
    updateUserBranchs,
    getUserBranchs,
    getPermissions,
    updateCompanySetting,
    getDataUser,
    getPermissisonByUsers,
    getUserByIdPopulate,
    saveDeviceMobile,
    verifyApp,
    getCompanyByCode,
    uploadUserExcel,
};
