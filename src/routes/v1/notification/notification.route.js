const express = require('express');
const notificationController = require('../../../controllers/notification/notification.controller');
const auth = require('../../../middlewares/auth');
const router = express.Router();

router.post('/susbscription', auth('susbscription'), notificationController.susbscription);
router.get('/get-my-notifications', auth('queryNotifications'), notificationController.queryNotifications);
router.patch('/read', auth('readNotification'), notificationController.readNotification);
router.patch('/un-read', auth('unReadNotification'), notificationController.unReadNotification);
router.patch('/read-all', auth('readAllNotification'), notificationController.readAllNotification);
router.get('/total-not-yet-viewed', auth('totalNotYetViewed'), notificationController.totalNotYetViewed);
router.get('/get-notification-setting', auth('getNotificationSetting'), notificationController.getNotificationSetting);
router.patch(
    '/update-notification-setting',
    auth('updateNotificationSetting'),
    notificationController.updateNotificationSetting
);
router.get('/get-notification-types', auth('getNotificationTypes'), notificationController.getNotificationTypes);
router.patch('/update-notification-type', auth('updateNotificationType'), notificationController.updateNotificationType);
router.patch('/get-notification-user', auth('getNotificationUsers'), notificationController.getNotificationUsers);
router.patch('/delete-notification-user', auth('deleteNotificationUsers'), notificationController.deleteNotificationUsers);
module.exports = router;
