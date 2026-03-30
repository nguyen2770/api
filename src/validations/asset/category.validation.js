const Joi = require('joi');
const { objectId } = require('../common/custom.validation');


const getUser = {
    params: Joi.object().keys({
        userId: Joi.string().custom(objectId),
    }),
};


module.exports = {
    getUser,
};
