const passport = require('passport');
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const { roleRights } = require('../config/roles');

const verifyCallback =
    (
        req,
        resolve,
        reject,
        requiredRights
    ) =>
        async (err, data, info) => {
            // if (err || info || !data) {
            //     return reject(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
            // }
            req.user = data.user;
            req.company = data.company
            resolve();
        };

const auth =
    (...requiredRights) =>
        async (req, res, next) => {
            return new Promise((resolve, reject) => {
                passport.authenticate('jwt', { session: false }, verifyCallback(req, resolve, reject, requiredRights))(
                    req,
                    res,
                    next
                );
            })
                .then(() => next())
                .catch((err) => {
                    // console.log("err", err)
                    next(err)
                });
        };

module.exports = auth;
