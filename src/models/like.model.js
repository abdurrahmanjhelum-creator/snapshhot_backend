const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true
    }
}, { timestamps: true });

// Ensure a user can only like a specific post once
likeSchema.index({ userId: 1, postId: 1 }, { unique: true });

const LikeModel = mongoose.model('Like', likeSchema);

module.exports = LikeModel;