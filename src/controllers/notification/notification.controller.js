const notificationService = require('../../services/notification/notification.service');
var crypto = require('crypto');
const webpush = require('web-push');
const catchAsync = require('../../utils/catchAsync');
const pick = require('../../utils/pick');
const { Types } = require('mongoose');
function createHash(input) {
    const md5sum = crypto.createHash('md5');
    md5sum.update(Buffer.from(input));
    return md5sum.digest('hex');
}
const susbscription = catchAsync(async (req, res) => {
    const subscription = req.body.subscription;
    const susbscriptionId = createHash(JSON.stringify(subscription));
    const deviceLogin = {
        deviceLoginName: req.body.name,
        model: req.body.model,
        version: req.body.version,
        major: req.body.major,
        user: req.user.id,
        susbscriptionId: susbscriptionId,
        endpoint: subscription.endpoint,
        expirationTime: subscription.expirationTime,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
    };
    const _deviceLogin = await notificationService.createDeviceLogin(deviceLogin);
    res.send({ code: 1, data: _deviceLogin });
});
const queryNotifications = catchAsync(async (req, res) => {
    const filter = {
        user: Types.ObjectId(req.user.id),
    };
    const options = pick(req.query, ['limit', 'page']);
    const result = await notificationService.queryNotifications(filter, options);
    res.send({ code: 1, data: result });
});
const readNotification = catchAsync(async (req, res) => {
    const notification = await notificationService.readNotification(req.body.id);
    res.send({ code: 1, data: notification });
});
const unReadNotification = catchAsync(async (req, res) => {
    const notification = await notificationService.unReadNotification(req.body.id);
    res.send({ code: 1, data: notification });
});
const readAllNotification = catchAsync(async (req, res) => {
    const notification = await notificationService.readAllNotification(Types.ObjectId(req.user.id));
    res.send({ code: 1, data: notification });
});
const totalNotYetViewed = catchAsync(async (req, res) => {
    const totalNotification = await notificationService.totalNotYetViewed(req.user.id);
    res.send({ code: 1, data: totalNotification });
});
const getNotificationSetting = catchAsync(async (req, res) => {
    const notificationSetting = await notificationService.getNotificationSetting(req.user.company);
    res.send({ code: 1, data: notificationSetting });
});
const updateNotificationSetting = catchAsync(async (req, res) => {
    const notificationSetting = await notificationService.updateNotificationSetting(req.user.company, {
        ...req.body,
        company: req.user.company,
    });
    res.send({ code: 1, data: notificationSetting });
});
const getNotificationTypes = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['name', 'code']);
    const options = pick(req.query, ['limit', 'page']);
    const notificationTypes = await notificationService.getNotificationTypes(filter, options);
    res.send({ code: 1, data: notificationTypes });
});
const updateNotificationType = catchAsync(async (req, res) => {
    const { id, ...updateBody } = req.body;
    const notificationType = await notificationService.updateNotificationType(id, updateBody);
    res.send({ code: 1, data: notificationType });
});
const getNotificationUsers = catchAsync(async (req, res) => {
    const filter = pick(req.body, ["isOpen"])
    const options = pick(req.body, ['limit', 'page']);
    const result = await notificationService.getNotificationUsers(filter, options, Types.ObjectId(req.user.id),);
    res.send({ code: 1, data: result });
});
const deleteNotificationUsers = catchAsync(async (req, res) => {
    const result = await notificationService.deleteNotificationUsers(req.body.id);
    res.send({ code: 1, data: result });
});
module.exports = {
    susbscription,
    queryNotifications,
    readNotification,
    unReadNotification,
    readAllNotification,
    totalNotYetViewed,
    getNotificationSetting,
    updateNotificationSetting,
    getNotificationTypes,
    updateNotificationType,
    getNotificationUsers,
    deleteNotificationUsers,
};
