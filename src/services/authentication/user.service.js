const httpStatus = require('http-status');
const { User, RolePermissionModel, StockLocation, RoleModel, Branch, Department } = require('../../models');
const ApiError = require('../../utils/ApiError');
const UserBranchModel = require('../../models/users/userBranch.model');
const CompanySettingModel = require('../../models/common/companySetting.model');
const DeviceMobileModel = require('../../models/authentication/deviceMobile.model');
const CompanyModel = require('../../models/users/company.model');
const { stockLocationCode } = require('../../utils/constant');
const { prepareImportFile, rollbackImport } = require('../common/importData.service');
const XLSX = require('xlsx');
const fs = require('fs');
const bcrypt = require('bcryptjs');
/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const createUser = async (userBody) => {
    // if (await User.isUsernameTaken(userBody.username)) {
    //     throw new ApiError(httpStatus.BAD_REQUEST, 'Username already taken');
    // }
    return User.create(userBody);
};

/**
 * Query for users
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryUsers = async (filter, options) => {
    const { searchText, ...otherFilters } = filter;
    let finalFilter = { ...otherFilters };
    if (searchText) {
        const searchRegex = new RegExp(searchText, 'i');
        finalFilter.$or = [{ fullName: searchRegex }, { contactNo: searchRegex }, { email: searchRegex }];
    }
    console.log("finalFilter", finalFilter)

    const users = await User.paginate(finalFilter, {
        ...options,
        populate: [
            { path: 'role', select: 'name' },
            { path: 'branch', select: 'name' },
            { path: 'department', select: 'departmentName' },
        ],
    });

    return users;
};

/**
 * Get user by id
 * @param {ObjectId} id
 * @returns {Promise<User>}
 */
const getUserById = async (id) => {
    return User.findById(id);
};

/**
 * Get user by email
 * @param {string} username
 * @returns {Promise<User>}
 */
const getUserByUsername = async (username) => {
    return User.findOne({ username });
};
const getUserByEmail = async (_email) => {
    return User.findOne({ email: _email });
};
const getUserByIdPopulate = async (id) => {
    return User.findById(id).populate([{ path: 'role' }, { path: 'branch' }, { path: 'department' }]);
};

/**
 * Update user by id
 * @param {ObjectId} userId
 * @param {Object} updateBody
 * @returns {Promise<User>}
 */
const updateUserById = async (userId, updateBody) => {
    const user = await getUserById(userId);
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    // if (updateBody.username && (await User.isUsernameTaken(updateBody.username, userId))) {
    //     throw new ApiError(httpStatus.BAD_REQUEST, 'Username already taken');
    // }
    Object.assign(user, updateBody);
    await user.save();
    return user;
};

/**
 * Delete user by id
 * @param {ObjectId} userId
 * @returns {Promise<User>}
 */
const deleteUserById = async (userId) => {
    const user = await getUserById(userId);
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    await user.remove();
    return user;
};

const updateStatus = async (id, updateBody) => {
    const user = await getUserById(id);
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    Object.assign(user, updateBody);
    await user.save();
    return user;
};

const getAllUser = async () => {
    const Users = await User.find();
    return Users;
};
const updateUserBranchs = async (userId, _userBranchs) => {
    // xóa dữ liệu cũ
    await UserBranchModel.deleteMany({ user: userId });
    const userBranchs = await UserBranchModel.insertMany(_userBranchs);
    return userBranchs;
};
const getUserBranchs = async (userId) => {
    // xóa dữ liệu cũ
    const userBranchs = await UserBranchModel.find({ user: userId }).populate([{ path: 'branch' }]);
    return userBranchs;
};
const verifyApp = async (deviceToken, userId) => {
    console.log('deviceToken', deviceToken);
    console.log('userId', userId);
    const _deviceMobileFind = await DeviceMobileModel.findOne({
        deviceToken: deviceToken,
        user: userId,
    });
    return _deviceMobileFind;
};
const logoutMobile = async (deviceToken, userId) => {
    await DeviceMobileModel.deleteMany({ deviceToken: deviceToken, user: userId });
};
const saveDeviceMobile = async (deviceMobile) => {
    const _deviceMobileFind = await DeviceMobileModel.findOne({
        deviceToken: deviceMobile.deviceToken,
    });
    if (_deviceMobileFind) {
        await DeviceMobileModel.findOneAndUpdate(
            { deviceToken: deviceMobile.deviceToken }, // điều kiện tìm
            { $set: { ...deviceMobile } },
            { new: true } // ✅ trả về bản ghi sau khi update
        );
    } else {
        return await DeviceMobileModel.create(deviceMobile);
    }
    return _deviceMobileFind;
};
const getCompanySetting = async (companyId) => {
    // xóa dữ liệu cũ
    let companySetting = await CompanySettingModel.findOne({ company: companyId });
    if (companySetting) return companySetting
    let location = await StockLocation.findOne({
        usage: "INTERNAL",
    });

    if (!location) {
        location = await StockLocation.create({
            name: "Stock Location main",
            code: stockLocationCode.INTERNAL_MAIN,
            usage: "INTERNAL",
        });
    }

    companySetting = await CompanySettingModel.create({
        locationDefault: location._id,
        company: companyId,
    });

    return companySetting;
};
const getPermisisons = async (userId) => {
    // xóa dữ liệu cũ
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    const permissions = await RolePermissionModel.find({ user: user.role }).populate([{ path: 'permission' }]);
    return permissions;
};
const getPermissisonByUsers = async (userId) => {
    // xóa dữ liệu cũ
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    const rolePermissionModels = await RolePermissionModel.find({ role: user.role }).populate([{ path: 'permission' }]);
    const permissions = rolePermissionModels.map((rp) => rp.permission);
    return permissions;
};
const updateCompanySetting = async (company, _companySetting) => {
    const companySetting = await CompanySettingModel.findOne({ company: company.id });
    if (!companySetting) {
        const _companySetiingCreate = await CompanySettingModel.create({ ..._companySetting, company: company.id });
        return _companySetiingCreate;
    }
    Object.assign(companySetting, _companySetting);
    await companySetting.save();
    return companySetting;
};
const getCompanyByCode = async (code) => {
    const company = await CompanyModel.findOne({ code: code });
    return company;
};
const uploadUserExcel = async (filePath, file) => {
    let importData;
    try {
        const { uploadDir, filePath: _filePath, resourceImportData } = await prepareImportFile(file, 'user');
        const importData = resourceImportData;

        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        const docs = [];
        const errors = [];
        const warnings = [];
        const duplicateInFileChecker = new Set();

        const usernames = [...new Set(jsonData.map((r) => r['Tên đăng nhập']))];
        const existingUsernames = await User.find({ username: { $in: usernames } });
        const usernameMap = new Map(existingUsernames.map((c) => [c.username, c]));

        const roles = [...new Set(jsonData.map((r) => r['Nhóm quyền']))];
        const existingRoles = await RoleModel.find({ name: { $in: roles } });
        const roleMap = new Map(existingRoles.map((c) => [c.name, c]));

        const branchs = [...new Set(jsonData.map((r) => r['Chi nhánh']))];
        const existingBranchs = await Branch.find({ name: { $in: branchs } });
        const branchMap = new Map(existingBranchs.map((c) => [c.name, c]));

        const departments = [...new Set(jsonData.map((r) => r['Phòng ban']))];
        const existingDepartments = await Department.find({ departmentName: { $in: departments } });
        const departmentMap = new Map(existingDepartments.map((c) => [c.departmentName, c]));

        const existingMap = new Map(
            existingUsernames.map((m) => [`${m.username}`, true])
        );

        for (const row of jsonData) {
            const stt = row.STT;
            const fullName = row['Họ và tên'] ? String(row['Họ và tên']).trim() : '';
            const email = row['Email'] ? String(row['Email']).trim() : '';
            const phoneNumber = row['Số điện thoại'] ? String(row['Số điện thoại']).trim() : '';
            const role = row['Nhóm quyền'] ? String(row['Nhóm quyền']).trim() : '';
            const branch = row['Chi nhánh'] ? String(row['Chi nhánh']).trim() : '';
            const department = row['Phòng ban'] ? String(row['Phòng ban']).trim() : '';
            const username = row['Tên đăng nhập'] ? String(row['Tên đăng nhập']).trim() : '';
            const password = row['Mật khẩu'] ? String(row['Mật khẩu']).trim() : '';
            if (!fullName || !phoneNumber || !role || !username || !password) {
                errors.push(`❌ Lỗi ở dòng có STT là: ${stt}: Thiếu dữ liệu bắt buộc`);
                continue;
            }
            let _role = roleMap.get(role);
            if (!_role) {
                _role = await RoleModel.create({
                    name: role,
                });
                roleMap.set(role, _role);
            }
            const roleIdStr = _role._id.toString();

            let branchIdStr = null;
            if (branch) {
                let _branch = branchMap.get(branch);
                if (!_branch) {
                    _branch = await Branch.create({
                        name: branch,
                    });
                    branchMap.set(branch, _branch);
                }
                branchIdStr = _branch._id.toString();
            }

            let departmentIdStr = null;
            if (department) {
                let _department = departmentMap.get(department);
                if (!_department) {
                    _department = await Department.create({
                        departmentName: department,
                    });
                    departmentMap.set(department, _department);
                }
                departmentIdStr = _department._id.toString();
            }
            const fileKey = `${username}`;
            if (duplicateInFileChecker.has(fileKey)) {
                warnings.push(
                    `⚠️ Dòng STT ${stt}: Tên đăng nhập "${username}" bị lặp lại trong file.`
                );
                continue;
            }
            duplicateInFileChecker.add(fileKey);
            if (existingMap.has(fileKey)) {
                warnings.push(
                    `⚠️ Dòng STT ${stt}: Tên đăng nhập "${username}" đã tồn tại trong hệ thống.`
                );
                continue;
            }

            docs.push({
                // resourceImportData: resourceImportData._id,
                fullName,
                email,
                contactNo: phoneNumber,
                role: roleIdStr,
                branch: branchIdStr,
                department: departmentIdStr,
                username,
                password: await bcrypt.hash(password, 8),
            });
        }

        if (errors.length > 0) {
            await rollbackImport(importData._id, filePath);
            return { success: false, errors };
        }
        if (docs.length > 0) {
            await User.insertMany(docs);
        }
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        fs.renameSync(filePath, _filePath);
        return {
            success: true,
            insertCount: docs.length,
            warnings: warnings.length > 0 ? warnings : null,
        };
    } catch (error) {
        if (importData) {
            await rollbackImport(importData._id, filePath);
        }
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
    }
};

const getListKs = async (filter, options) => {
    const { searchText, ...otherFilters } = filter;

    const roleid = [
        '690a2d4a1ac4320408d689bd',
        '6978728bd85fcb5d00f82e8c',
        '69787293d85fcb5d00f82e96',
        '69cfd4af11ac2236bc700def',
        '6978729ad85fcb5d00f82ea0',
        '69e8eaaffb4720dea03eec96'
    ];
    let finalFilter = {
        ...otherFilters,
        role: { $in: roleid }
    };


    if (searchText) {
        const searchRegex = new RegExp(searchText, 'i');
        finalFilter.$or = [{ fullName: searchRegex }, { contactNo: searchRegex }, { email: searchRegex }];
    }

    const users = await User.paginate(finalFilter, {
        ...options,
        populate: [
            { path: 'role', select: 'name' },
            { path: 'branch', select: 'name' },
            { path: 'department', select: 'departmentName' },
        ],
    });

    return users;
};
module.exports = {
    createUser,
    queryUsers,
    getUserById,
    getUserByUsername,
    updateUserById,
    deleteUserById,
    updateStatus,
    getAllUser,
    updateUserBranchs,
    getUserBranchs,
    getPermisisons,
    updateCompanySetting,
    getCompanySetting,
    getPermissisonByUsers,
    getUserByIdPopulate,
    getUserByEmail,
    saveDeviceMobile,
    verifyApp,
    logoutMobile,
    getCompanyByCode,
    uploadUserExcel,
    getListKs
};
