const PostModel = require('../models/post.model');
const commentModel = require('../models/comment.model');
const uploadImage = require('../services/storage.service');
const { getIO } = require('../utils/socket');

/*
|--------------------------------------------------------------------------
| CREATE POST
|--------------------------------------------------------------------------
*/
async function createPost(req, res) {
    try {
        const { title, description, completed } = req.body;
        const file = req.file;

        // Check authentication
        if (!req.userId) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized'
            });
        }

        // Check image
        if (!file) {
            return res.status(400).json({
                success: false,
                error: 'No file uploaded'
            });
        }

        // Upload image to storage
        const result = await uploadImage(file.buffer);

        // Create post
        const post = await PostModel.create({
            title,
            description,
            // Parse boolean from string (FormData sends strings)
            completed: completed === 'true' || completed === true,
            image: result.url,
            userId: req.userId
        });

        // Increment user's post count
        const authModel = require('../models/auth.model');
        await authModel.findByIdAndUpdate(req.userId, { $inc: { postCount: 1 } });

        return res.status(201).json({
            success: true,
            message: 'Post created successfully',
            post
        });

    } catch (error) {
        console.error('Create post error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to create post',
            message: error.message
        });
    }
}

/*
|--------------------------------------------------------------------------
| GET ALL POSTS (The Feed)
|--------------------------------------------------------------------------
*/
async function getPost(req, res) {
    try {
        const currentUserId = req.userId || null;

        const posts = await PostModel.find()
            .populate('userId', 'username avatar profilePicture')
            .populate('likes', '_id')
            .sort({ createdAt: -1 });

        const serializedPosts = await Promise.all(posts.map(async (post) => {
            const postObj = post.toObject ? post.toObject() : post;
            const likes = Array.isArray(postObj.likes)
                ? postObj.likes.map((likeUser) => likeUser && likeUser.toString ? likeUser.toString() : String(likeUser))
                : [];

            postObj.likes = likes;
            postObj.likesCount = likes.length;
            postObj.commentsCount = await commentModel.countDocuments({ postId: post._id });
            postObj.currentUserId = currentUserId;
            postObj.isLiked = !!currentUserId && likes.includes(currentUserId.toString());

            return postObj;
        }));

        return res.status(200).json({
            success: true,
            message: 'Posts fetched successfully',
            count: serializedPosts.length,
            posts: serializedPosts
        });

    } catch (error) {
        console.error('Get posts error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch posts',
            message: error.message
        });
    }
}

/*
|--------------------------------------------------------------------------
| UPDATE POST
|--------------------------------------------------------------------------
*/
async function updatePost(req, res) {
    try {
        const { id } = req.params;
        const { title, description, completed } = req.body;
        const image = req.file;
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized'
            });
        }

        const post = await PostModel.findById(id);

        if (!post) {
            return res.status(404).json({
                success: false,
                error: 'Post not found'
            });
        }

        // Check ownership
        if (post.userId.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                error: 'You are not authorized to update this post'
            });
        }

        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (completed !== undefined) {
            updateData.completed = completed === 'true' || completed === true;
        }

        if (image) {
            const result = await uploadImage(image.buffer);
            updateData.image = result.url;
        }

        const updatedPost = await PostModel.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate('userId', 'username avatar');

        return res.status(200).json({
            success: true,
            message: 'Post updated successfully',
            post: updatedPost
        });

    } catch (error) {
        console.error('Update post error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to update post',
            message: error.message
        });
    }
}

/*
|--------------------------------------------------------------------------
| DELETE POST
|--------------------------------------------------------------------------
*/
async function deletePost(req, res) {
    try {
        const { id } = req.params;
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized'
            });
        }

        const post = await PostModel.findById(id);

        if (!post) {
            return res.status(404).json({
                success: false,
                error: 'Post not found'
            });
        }

        if (post.userId.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                error: 'You are not authorized to delete this post'
            });
        }

        await PostModel.findByIdAndDelete(id);

        // Decrement user's post count
        const authModel = require('../models/auth.model');
        await authModel.findByIdAndUpdate(userId, { $inc: { postCount: -1 } });

        return res.status(200).json({
            success: true,
            message: 'Post deleted successfully'
        });

    } catch (error) {
        console.error('Delete post error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to delete post',
            message: error.message
        });
    }
}

/*
|--------------------------------------------------------------------------
| GET MY POSTS
|--------------------------------------------------------------------------
*/
async function toggleLikePost(req, res) {
    try {
        const { postId } = req.params;
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized'
            });
        }

        const post = await PostModel.findById(postId);

        if (!post) {
            return res.status(404).json({
                success: false,
                error: 'Post not found'
            });
        }

        const alreadyLiked = post.likes.some((likeUserId) => likeUserId.toString() === userId.toString());
        const update = alreadyLiked
            ? { $pull: { likes: userId } }
            : { $addToSet: { likes: userId } };

        const updatedPost = await PostModel.findByIdAndUpdate(postId, update, { new: true })
            .populate('userId', 'username avatar profilePicture')
            .populate('likes', '_id');

        const likes = Array.isArray(updatedPost.likes)
            ? updatedPost.likes.map((likeUser) => likeUser.toString())
            : [];

        const isLiked = !alreadyLiked;

        const io = getIO();
        io.to(`post-${postId}`).emit(isLiked ? 'like-added' : 'like-removed', {
            postId,
            userId,
            likesCount: likes.length
        });

        return res.status(200).json({
            success: true,
            message: isLiked ? 'Post liked successfully' : 'Post unliked successfully',
            post: {
                ...updatedPost.toObject(),
                likes,
                likesCount: likes.length,
                commentsCount: await commentModel.countDocuments({ postId }),
                currentUserId: userId,
                isLiked
            }
        });
    } catch (error) {
        console.error('Toggle like error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to toggle like',
            message: error.message
        });
    }
}

async function getMyPost(req, res) {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized'
            });
        }

        const posts = await PostModel.find({ userId: userId })
            .populate('userId', 'username avatar profilePicture')
            .populate('likes', '_id')
            .sort({ createdAt: -1 });

        const serializedPosts = await Promise.all(posts.map(async (post) => {
            const postObj = post.toObject ? post.toObject() : post;
            const likes = Array.isArray(postObj.likes)
                ? postObj.likes.map((likeUser) => likeUser && likeUser.toString ? likeUser.toString() : String(likeUser))
                : [];

            postObj.likes = likes;
            postObj.likesCount = likes.length;
            postObj.commentsCount = await commentModel.countDocuments({ postId: post._id });
            postObj.currentUserId = userId;
            postObj.isLiked = likes.includes(userId.toString());

            return postObj;
        }));

        return res.status(200).json({
            success: true,
            message: 'My posts fetched successfully',
            posts: serializedPosts
        });

    } catch (error) {
        console.error('Get my posts error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch your posts',
            message: error.message
        });
    }
}


/*
|--------------------------------------------------------------------------
| SEARCH POSTS
|--------------------------------------------------------------------------
*/
async function searchPosts(req, res) {
    try {
        const { query } = req.query;

        if (!query || query.trim() === '') {
            return res.status(400).json({ success: false, error: 'Query is required' });
        }

        const UserModel = require('../models/auth.model');

        // Find matching users by username (case-insensitive)
        const users = await UserModel.find({ username: { $regex: query, $options: 'i' } }).select('_id');
        const userIds = users.map(u => u._id);

        // Build OR conditions: title, description, or userId in matching users
        const orConditions = [
            { title: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } }
        ];

        if (userIds.length > 0) {
            orConditions.push({ userId: { $in: userIds } });
        }

        const posts = await PostModel.find({ $or: orConditions })
            .populate('userId', 'username avatar')
            .sort({ createdAt: -1 });

        return res.status(200).json({ success: true, posts });

    } catch (error) {
        console.error('Search posts error:', error);
        return res.status(500).json({ success: false, error: 'Failed to search posts', message: error.message });
    }
}

module.exports = {
    createPost,
    getPost,
    toggleLikePost,
    updatePost,
    deletePost,
    getMyPost,
    searchPosts
};
