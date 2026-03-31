const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const { authService, userService, tokenService, emailService } = require('../../services');

const register = catchAsync(async (req, res) => {
    const user = await userService.createUser(req.body);
    const tokens = await tokenService.generateAuthTokens(user);
    res.status(httpStatus.CREATED).send({ user, tokens });
});

const login = catchAsync(async (req, res) => {
    const { username, password } = req.body;
    const user = await authService.loginUserWithUsernameAndPassword(username, password);
    const tokens = await tokenService.generateAuthTokens(user);
    res.send({ user, tokens, code: 1 });
});
const teacherLogin = catchAsync(async (req, res) => {
    const { username, password } = req.body;
    const user = await authService.loginUserWithUsernameAndPassword(username, password);
    if (user.role !== 'teacher') {
        res.status(httpStatus.NO_CONTENT).send();
    }
    const tokens = await tokenService.generateAuthTokens(user);
    res.send({ user, tokens, code: 1 });
});
const logout = catchAsync(async (req, res) => {
    await authService.logout(req.body.refreshToken);
    res.status(httpStatus.NO_CONTENT).send();
});

const refreshTokens = catchAsync(async (req, res) => {
    const tokens = await authService.refreshAuth(req.body.refreshToken);
    res.send({ ...tokens, code: 1 });
});

const forgotPassword = catchAsync(async (req, res) => {
    const resetPasswordToken = await tokenService.generateResetPasswordToken(req.body.email);
    await emailService.sendResetPasswordEmail(req.body.email, resetPasswordToken);
    res.status(httpStatus.NO_CONTENT).send();
});

const resetPassword = catchAsync(async (req, res) => {
    const resetPasswordToken = await tokenService.generateResetPasswordTokenByUserName(req.body.username);
    await authService.resetPassword(resetPasswordToken, req.body.password);
    res.send({ code: 1 });
});

const changePassword = catchAsync(async (req, res) => {
    await authService.changePassword(req.user.username, req.body.oldPassword, req.body.newPassword);
    res.send({ code: 1 });
});
const logoutMobile = catchAsync(async (req, res) => {
    const { deviceToken } = req.body;
    if (deviceToken) {
        await userService.logoutMobile(deviceToken, req.user.id);
    }
    res.send({ code: 1 });
});
const sendVerificationEmail = catchAsync(async (req, res) => {
    const verifyEmailToken = await tokenService.generateVerifyEmailToken(req.user);
    await emailService.sendVerificationEmail(req.user.email, verifyEmailToken);
    res.status(httpStatus.NO_CONTENT).send();
});

const verifyEmail = catchAsync(async (req, res) => {
    await authService.verifyEmail(req.query.token);
    res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
    register,
    login,
    logout,
    refreshTokens,
    forgotPassword,
    resetPassword,
    sendVerificationEmail,
    verifyEmail,
    teacherLogin,
    changePassword,
    logoutMobile,
};
