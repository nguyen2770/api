const Joi = require('joi');
const { password } = require('../common/custom.validation');

const createUser = {
    body: Joi.object().keys({
        username: Joi.string().required(),
        password: Joi.string().required().custom(password),
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        email: Joi.string().email().required(),
        contactNo: Joi.string().required(),
        designation: Joi.string().required(),
        role: Joi.string(),
    }),
};

const getUsers = {
    query: Joi.object().keys({
        username: Joi.string(),
        role: Joi.string(),
        sortBy: Joi.string(),
        limit: Joi.number().integer(),
        page: Joi.number().integer(),
        fullName: Joi.string()
    }),
};

const getUser = {
    params: Joi.object().keys({
    }),
};

const updateUser = {
    params: Joi.object().keys({
    }),
    body: Joi.object()
        .keys({
            username: Joi.string(),
            password: Joi.string().custom(password),
            role: Joi.string(),
            balance: Joi.number(),
            firstName: Joi.string().required(),
            lastName: Joi.string().required(),
            email: Joi.string().email().required(),
            contactNo: Joi.string().required(),
            designation: Joi.string().required(),
        })
        .min(1),
};

const deleteUser = {
    params: Joi.object().keys({
    }),
};

module.exports = {
    createUser,
    getUsers,
    getUser,
    updateUser,
    deleteUser,
};
