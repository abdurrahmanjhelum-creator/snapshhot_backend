const likeModel = require('../models/like.model');
const PostModel = require('../models/post.model');
const NotificationModel = require('../models/notification.model');
const { getIO } = require('../utils/socket.js');

async function like(req, res) {
    const { postId } = req.params;
    const userId = req.userId;

    const existingLike = await likeModel.findOne({ userId, postId });

    if (existingLike) {
        return res.status(400).json({
            message: 'Already liked this post'
        });
    }

    const newLike = await likeModel.create({
        userId,
        postId
    });

    const post = await PostModel.findById(postId).populate('userId', 'username');
    const recipientId = post?.userId?._id?.toString();
    const senderName = post?.userId && post.userId._id.toString() === userId.toString()
        ? 'You'
        : 'Someone';

    if (recipientId && recipientId !== userId.toString()) {
        await NotificationModel.create({
            recipient: recipientId,
            sender: userId,
            type: 'like',
            post: postId,
            read: false
        });

        const io = getIO();
        io.to(`user-${recipientId}`).emit('notification-added', {
            recipientId,
            senderId: userId,
            senderName,
            type: 'like',
            postId
        });
    }

    const io = getIO();
    io.to(`post-${postId}`).emit('like-added', {
        postId,
        userId,
        recipientId,
        senderName,
        likeId: newLike._id
    });

    res.json({
        message: 'Post liked successfully',
        like: newLike
    });
}

/* Unlike post */
async function unlike(req, res) {
    const { postId } = req.params;
    const userId = req.userId;

    /* Delete like */
    const deletedLike = await likeModel.findOneAndDelete({ userId, postId });

    if (!deletedLike) {
        return res.status(404).json({
            message: 'Like not found'
        });
    }

    // Emit real-time event
    const io = getIO();
    io.to(`post-${postId}`).emit('like-removed', {
        postId,
        userId
    });

    res.json({
        message: 'Post unliked successfully'
    });
}

/* Get post likes */
async function getPostLikes(req, res) {
    const { postId } = req.params;

    try {
        const likes = await likeModel
            .find({ postId })
            .populate('userId', 'username avatar profilePicture')
            .sort({ createdAt: -1 });

        res.json({
            message: 'Post likes fetched successfully',
            likes: likes.map(like => ({
                userId: like.userId._id,
                username: like.userId.username,
                avatar: like.userId.avatar || like.userId.profilePicture,
                createdAt: like.createdAt
            }))
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error fetching likes',
            error: error.message
        });
    }
}

module.exports = {
    like,
    unlike,
    getPostLikes
};