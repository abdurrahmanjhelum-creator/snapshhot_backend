const commentModel = require('../models/comment.model');
const PostModel = require('../models/post.model');
const NotificationModel = require('../models/notification.model');
const { getIO } = require('../utils/socket.js');

/*Add comment - user post par comment likh sakta hai*/
async function addComment(req, res) {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.userId;

    /*Validation*/
    if (!content) {
        return res.status(400).json({
            message: 'Comment content is required'
        });
    }

    /*Comment create karo*/
    const newComment = await commentModel.create({
        content,
        userId,
        postId
    });

    const post = await PostModel.findById(postId).populate('userId', 'username');
    const populatedComment = await commentModel.findById(newComment._id)
        .populate('userId', 'username avatar profilePicture');

    const senderName = populatedComment?.userId?.username || 'Someone';
    const recipientId = post?.userId?._id?.toString();

    if (recipientId && recipientId !== userId.toString()) {
        await NotificationModel.create({
            recipient: recipientId,
            sender: userId,
            type: 'comment',
            post: postId,
            read: false
        });

        const io = getIO();
        io.to(`user-${recipientId}`).emit('notification-added', {
            recipientId,
            senderId: userId,
            senderName,
            type: 'comment',
            postId
        });
    }

    const io = getIO();
    io.to(`post-${postId}`).emit('comment-added', {
        postId,
        recipientId,
        senderName,
        comment: populatedComment
    });

    res.json({
        message: 'Comment added successfully',
        comment: newComment
    });
}

/*Delete comment - user apna comment delete kar sakta hai*/
async function deleteComment(req, res) {
    const { commentId } = req.params;
    const userId = req.userId;

    /*Comment find karo aur ownership check karo*/
    const comment = await commentModel.findById(commentId);

    if (!comment) {
        return res.status(404).json({
            message: 'Comment not found'
        });
    }

    if (comment.userId.toString() !== userId) {
        return res.status(403).json({
            message: 'You can only delete your own comments'
        });
    }

    /*Comment delete karo*/
    await commentModel.findByIdAndDelete(commentId);

    // Emit real-time event
    const io = getIO();
    io.to(`post-${comment.postId}`).emit('comment-deleted', {
        postId: comment.postId,
        commentId
    });

    res.json({
        message: 'Comment deleted successfully',
        commentId,
        postId: comment.postId
    });
}

/*Update comment - user apna comment update kar sakta hai*/
async function updateComment(req, res) {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.userId;

    /*Validation*/
    if (!content) {
        return res.status(400).json({
            message: 'Comment content is required'
        });
    }

    /*Comment find karo aur ownership check karo*/
    const comment = await commentModel.findById(commentId);

    if (!comment) {
        return res.status(404).json({
            message: 'Comment not found'
        });
    }

    if (comment.userId.toString() !== userId) {
        return res.status(403).json({
            message: 'You can only update your own comments'
        });
    }

    /*Comment update karo*/
    comment.content = content;
    await comment.save();

    // Populate user details before emitting
    const populatedComment = await commentModel.findById(commentId)
        .populate('userId', 'username avatar profilePicture');

    // Emit real-time event
    const io = getIO();
    io.to(`post-${comment.postId}`).emit('comment-updated', {
        postId: comment.postId,
        comment: populatedComment
    });

    res.json({
        message: 'Comment updated successfully',
        comment
    });
}

/*Get comments for a post - post ke saare comments dekhne ke liye*/
async function getComments(req, res) {
    const { postId } = req.params;

    /*Post ke saare comments get karo with user details*/
    const comments = await commentModel.find({ postId })
        .populate('userId', 'username email avatar profilePicture')
        .sort({ createdAt: -1 });

    res.json({
        message: 'Comments fetched successfully',
        comments
    });
}

module.exports = {
    addComment,
    deleteComment,
    updateComment,
    getComments
};
