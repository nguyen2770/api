const Joi = require('joi');
const { password } = require('../common/custom.validation');

const register = {
    body: Joi.object().keys({
        username: Joi.string().required().min(8).max(20),
        password: Joi.string().required().custom(password),
        fullName: Joi.string().required(),
        role: Joi.string().required(),
    }),
};

const login = {
    body: Joi.object().keys({
        username: Joi.string().required(),
        password: Joi.string().required()
    }),
};

const logout = {
    body: Joi.object().keys({
        refreshToken: Joi.string().required(),
    }),
};

const refreshTokens = {
    body: Joi.object().keys({
        refreshToken: Joi.string().required(),
    }),
};

const forgotPassword = {
    body: Joi.object().keys({
        email: Joi.string().email().required(),
    }),
};

const resetPassword = {
    query: Joi.object().keys({
        token: Joi.string().required(),
    }),
    body: Joi.object().keys({
        password: Joi.string().required().custom(password),
    }),
};

const verifyEmail = {
    query: Joi.object().keys({
        token: Joi.string().required(),
    }),
};

module.exports = {
    register,
    login,
    logout,
    refreshTokens,
    forgotPassword,
    resetPassword,
    verifyEmail,
};
