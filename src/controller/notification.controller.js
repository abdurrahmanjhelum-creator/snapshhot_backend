const NotificationModel = require('../models/notification.model');

async function getNotifications(req, res) {
    try {
        const userId = req.userId;

        const notifications = await NotificationModel.find({ recipient: userId })
            .populate('sender', 'username avatar profilePicture')
            .populate('post', 'image description')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            notifications: notifications.map((notification) => ({
                _id: notification._id,
                recipient: notification.recipient,
                sender: notification.sender ? {
                    _id: notification.sender._id,
                    username: notification.sender.username,
                    avatar: notification.sender.avatar || notification.sender.profilePicture || ''
                } : null,
                type: notification.type,
                post: notification.post ? {
                    _id: notification.post._id,
                    image: notification.post.image,
                    description: notification.post.description
                } : null,
                read: notification.read,
                createdAt: notification.createdAt
            }))
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error fetching notifications',
            error: error.message
        });
    }
}

async function markNotificationsAsRead(req, res) {
    try {
        const userId = req.userId;

        await NotificationModel.updateMany(
            { recipient: userId, read: false },
            { $set: { read: true } }
        );

        return res.status(200).json({
            success: true,
            message: 'Notifications marked as read'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error marking notifications as read',
            error: error.message
        });
    }
}

module.exports = {
    getNotifications,
    markNotificationsAsRead
};
