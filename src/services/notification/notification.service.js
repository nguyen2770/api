const httpStatus = require('http-status');
const DeviceLoginModel = require('../../models/users/deviceLogin.model');
const DeviceMobileModel = require('../../models/authentication/deviceMobile.model');
const { Expo } = require('expo-server-sdk');
const {
    NotificationModel,
    NotificationTypeModel,
    NotificationUserModel,
    NotificationSettingModel,
} = require('../../models/notification');
const config = require('../../config/config');
const ApiError = require('../../utils/ApiError');
const { notificationTypeCode } = require('../../utils/constant');
var crypto = require('crypto');
const webpush = require('web-push');

const vapidKeys = {
    privateKey: 'bdSiNzUhUP6piAxLH-tW88zfBlWWveIx0dAsDO66aVU',
    publicKey: 'BIN2Jc5Vmkmy-S3AUrcMlpKxJpLeVRAfu9WBqUbJ70SJOCWGCGXKY-Xzyh7HDr6KbRDGYHjqZ06OcS3BjD7uAm8',
};
webpush.setVapidDetails('mailto:example@yourdomain.org', vapidKeys.publicKey, vapidKeys.privateKey);
const createDeviceLogin = async (_model) => {
    // check tồn tại susbscriptionId
    const _checkDeviceLogin = await DeviceLoginModel.findOne({ susbscriptionId: _model.susbscriptionId });
    if (_checkDeviceLogin) {
        return DeviceLoginModel.findOneAndUpdate(
            { susbscriptionId: _model.susbscriptionId },
            {
                $set: {
                    ..._model,
                },
            }
        );
    }
    return DeviceLoginModel.create(_model);
};
const getNotificationTypeByCode = async (_code, name, isNotifyTheManager) => {
    let notificationType = await NotificationTypeModel.findOne({ code: _code });
    if (!notificationType) {
        notificationType = await NotificationTypeModel.create({
            code: _code,
            name: name,
            isNotifyTheManager: isNotifyTheManager ? isNotifyTheManager : false,
        });
    }
    return notificationType;
};
const getDeviceLoginsByUserId = async (_userId) => {
    return DeviceLoginModel.find({ user: _userId });
};
const pushNotificationWithUser = async (notificationContent) => {
    const notificationType = await getNotificationTypeByCode(
        notificationContent.notificationTypeCode,
        notificationContent.notificationName,
        notificationContent.isNotifyTheManager
    );
    const notificationUser = {
        title: notificationType.title,
        text: notificationContent.text,
        notificationType: notificationType.id,
        user: notificationContent.user,
        tag: notificationType.tag ?? 'Thông báo',
        url: `${config.baseUrl}${notificationContent.subUrl}`,
        subUrl: notificationContent.subUrl,
        webUrl: `${config.baseUrlWeb}${notificationContent.webSubUrl}`,
        webSubUrl: notificationContent.webSubUrl,
    };
    await createNotificationUser(notificationUser);
};
const pushNotificationWithUsers = async (notificationContent) => {
    const notificationType = await getNotificationTypeByCode(
        notificationContent.notificationTypeCode,
        notificationContent.notificationName,
        notificationContent.isNotifyTheManager
    );
    for (const user of notificationContent.users) {
        const notificationUser = {
            title: notificationType.title,
            text: notificationContent.text,
            notificationType: notificationType.id,
            user: user,
            tag: notificationType.tag ?? 'Thông báo',
            url: `${config.baseUrl}${notificationContent.subUrl}`,
            subUrl: notificationContent.subUrl,
            webUrl: `${config.baseUrlWeb}${notificationContent.webSubUrl}`,
            webSubUrl: notificationContent.webSubUrl,
        };
        await createNotificationUser(notificationUser);
    }
};
const createNotificationUser = async (_notificationUser) => {
    // push notification
    let expo = new Expo({
        accessToken: config.expoAccessToken,
        /*
         * @deprecated
         * The optional useFcmV1 parameter defaults to true, as FCMv1 is now the default for the Expo push service.
         *
         * If using FCMv1, the useFcmV1 parameter may be omitted.
         * Set this to false to have Expo send to the legacy endpoint.
         *
         * See https://firebase.google.com/support/faq#deprecated-api-shutdown
         * for important information on the legacy endpoint shutdown.
         *
         * Once the legacy service is fully shut down, the parameter will be removed in a future PR.
         */
        useFcmV1: true,
    });
    _notificationUser.icon = 'https://resource.medicmms.vn/logo-small.png';
    _notificationUser.image = 'https://resource.medicmms.vn/logo.png';
    // _notificationUser.title = "Quản lý bảo trì sự cố"
    const deviceMobiles = await DeviceMobileModel.find({ user: _notificationUser.user });
    if (deviceMobiles && deviceMobiles.length > 0) {
        deviceMobiles.forEach(async (_deviceMobile) => {
            var messages = [];
            messages.push({
                to: _deviceMobile.deviceToken,
                title: _notificationUser.title,
                body: _notificationUser.text,
                sound: 'default',
                icon: _notificationUser.icon,
                data: {
                    url: _notificationUser.url,
                },
                richContent: {
                    image: _notificationUser.image,
                },
            });
            expo.sendPushNotificationsAsync(messages);
        });
    }
    return NotificationUserModel.create(_notificationUser);
};
const pushNotification = async (notificationContent) => {
    const notificationType = await getNotificationTypeByCode(
        notificationContent.notificationTypeCode,
        notificationContent.notificationName,
        notificationContent.isNotifyTheManager
    );
    if (notificationType && notificationType.users && notificationType.users.length > 0) {
        for (const user of notificationType.users) {
            const notificationUser = {
                title: notificationType.name || notificationType.title,
                text: notificationContent.text,
                notificationType: notificationType.id,
                user,
                tag: notificationType.tag ?? 'Thông báo',
                url: `${config.baseUrl}${notificationContent.subUrl}`,
                subUrl: notificationContent.subUrl,
                webUrl: `${config.baseUrlWeb}${notificationContent.webSubUrl}`,
                webSubUrl: notificationContent.webSubUrl,
            };
            await createNotificationUser(notificationUser);
        }
    }
};
const queryNotifications = async (filter, options) => {
    // eslint-disable-next-line no-return-await
    console.log('filter', filter);
    const notifications = await NotificationUserModel.paginate(filter, options);
    return notifications;
};
const readNotification = async (_id) => {
    const notificationUser = await NotificationUserModel.findById(_id);
    if (!notificationUser) {
        throw new ApiError(httpStatus.NOT_FOUND, 'role not found');
    }
    // if (notificationUser.viewTime) {
    //     throw new ApiError(httpStatus.EXPECTATION_FAILED, 'Đã đọc');
    // }
    let isNoOpen = !notificationUser.isOpen
        ? {
              isOpen: true,
          }
        : {};
    Object.assign(notificationUser, { viewTime: new Date(), ...isNoOpen });
    await notificationUser.save();
    return notificationUser;
};
const unReadNotification = async (_id) => {
    const notificationUser = await NotificationUserModel.findById(_id);
    if (!notificationUser) {
        throw new ApiError(httpStatus.NOT_FOUND, 'role not found');
    }
    Object.assign(notificationUser, { isOpen: false });
    await notificationUser.save();
    return notificationUser;
};
const readAllNotification = async (user) => {
    const finalFilter = {
        user: user,
        isOpen: false,
        isHidden: { $ne: true },
    };
    const results = await NotificationUserModel.updateMany(finalFilter, { $set: { isOpen: true } });
    if (results.matchedCount === 0) {
        return { message: 'No unread notifications' };
    }
    return results;
};
const totalNotYetViewed = async (userId) => {
    const totalNotification = await NotificationUserModel.countDocuments({
        user: userId,
        viewTime: {
            $exists: false,
        },
    });
    return totalNotification;
};
const getNotificationSetting = async (companyId) => {
    const notificationSetting = await NotificationSettingModel.findOne({ company: companyId });
    return notificationSetting;
};
const updateNotificationSetting = async (companyId, updateData) => {
    const notificationSetting = await NotificationSettingModel.findOneAndUpdate(
        { company: companyId },
        { $set: updateData },
        { new: true, upsert: true }
    );
    return notificationSetting;
};
const getNotificationTypes = async (filter, options) => {
    if (filter.name) {
        filter.name = {
            $regex: filter.name,
            $options: 'i',
        };
    }
    return NotificationTypeModel.paginate(filter, options);
};
const updateNotificationType = async (id, updateData) => {
    const notificationType = await NotificationTypeModel.findById(id);
    if (!notificationType) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Notification type not found');
    }
    Object.assign(notificationType, updateData);
    await notificationType.save();
    return notificationType;
};
const getNotificationUsers = async (filter, options, user) => {
    if (user) {
        filter.user = user;
    }
    const finalFilter = {
        ...filter,
        isHidden: { $ne: true },
    };

    const notificationUsers = await NotificationUserModel.paginate(finalFilter, options);
    const countUnRead = await NotificationUserModel.countDocuments({
        ...finalFilter,
        isOpen: false,
    });
    return {
        ...notificationUsers,
        countUnRead: countUnRead,
    };
};
const deleteNotificationUsers = async (_id) => {
    const notificationUser = await NotificationUserModel.findByIdAndUpdate(_id, { isHidden: true });
    if (!notificationUser) {
        throw new ApiError(httpStatus.NOT_FOUND, 'role not found');
    }
    if (notificationUser && notificationUser.isOpen === undefined) {
        notificationUser.isOpen = false;
        await notificationUser.save();
    }
    return notificationUser;
};
module.exports = {
    createDeviceLogin,
    getNotificationTypeByCode,
    getDeviceLoginsByUserId,
    createNotificationUser,
    queryNotifications,
    readNotification,
    unReadNotification,
    readAllNotification,
    totalNotYetViewed,
    getNotificationSetting,
    updateNotificationSetting,
    getNotificationTypes,
    updateNotificationType,
    pushNotification,
    pushNotificationWithUser,
    pushNotificationWithUsers,
    getNotificationUsers,
    deleteNotificationUsers,
};
