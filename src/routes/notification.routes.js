const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const notificationController = require('../controller/notification.controller');

const router = express.Router();

router.get('/', authMiddleware, notificationController.getNotifications);
router.patch('/read', authMiddleware, notificationController.markNotificationsAsRead);

module.exports = router;
