const { ActionLogModel } = require("../models");

function sanitize(obj) {
    if (!obj) return obj;
    const clone = { ...obj };
    ['password', 'token', 'refreshToken'].forEach(f => {
        if (clone[f]) clone[f] = '[REDACTED]';
    });
    return clone;
}

function trimLarge(obj, limit = 10000) {
    const str = JSON.stringify(obj);
    if (str.length > limit) {
        return { truncated: true, size: str.length };
    }
    return obj;
}

function getClientIp(req) {
    return (
        req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
        req.socket?.remoteAddress ||
        req.connection?.remoteAddress ||
        null
    );
}



const actionLogger = (isSkip = false) => {

    return (req, res, next) => {
        if (req.method === 'GET') return next();
        if (req.originalUrl.includes("get")) return next();
        const start = Date.now();
        const oldSend = res.send;


        res.send = function (data) {
            res.send = oldSend;
            res.send(data);

            const logData = {
                // action,
                method: req.method,
                route: req.originalUrl,
                params: req.params,
                query: req.query,

                request: sanitize(req.body),
                response: trimLarge(data),

                // before: trimLarge(req._oldData),
                // after: trimLarge(req._newData),

                statusCode: res.statusCode,
                ip: getClientIp(req),
                userAgent: req.headers['user-agent'],
                duration: Date.now() - start,
                createdBy: req.user?.id || req.user?._id,
            };

            ActionLogModel.create(logData).catch(e => console.error(e));
        };

        next();
    };
};

module.exports = {
    actionLogger
}
