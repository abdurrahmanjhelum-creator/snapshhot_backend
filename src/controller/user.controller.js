const UserModel = require('../models/auth.model.js');
const PostModel = require('../models/post.model');
const uploadImage = require('../services/storage.service');


/*
|--------------------------------------------------------------------------
| GET USER PROFILE
|--------------------------------------------------------------------------
*/
async function getUserProfile(req, res) {
    try {
        const { id } = req.params;

        console.log('Fetching profile for user ID:', id);

        const user = await UserModel.findById(id).select('-password');

        if (!user) {
            console.log('User not found with ID:', id);
            return res.status(404).json({
                error: 'User not found'
            });
        }

        const userObject = user.toObject();

        return res.status(200).json({
            message: 'User profile fetched successfully',
            user: userObject
        });

    } catch (error) {
        console.error('Get user profile error:', error);

        return res.status(500).json({
            error: 'Failed to fetch user profile',
            message: error.message
        });
    }
}


/*
|--------------------------------------------------------------------------
| UPDATE PROFILE
|--------------------------------------------------------------------------
*/
async function updateProfile(req, res) {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({
                error: 'Unauthorized'
            });
        }

        const { username, bio } = req.body;
        const image = req.file;

        const updateData = {};

        if (username !== undefined) {
            updateData.username = username;
        }

        if (bio !== undefined) {
            updateData.bio = bio;
        }

        if (image)  {
            const result = await uploadImage(image.buffer);
            updateData.avatar = result.url;
        }

        const updatedUser = await UserModel.findByIdAndUpdate(
            userId,
            updateData,
            {
                new: true,
                runValidators: true
            }
        ).select('-password');

        const userObject = updatedUser.toObject();

        return res.status(200).json({
            message: 'Profile updated successfully',
            user: userObject
        });

    } catch (error) {
        console.error('Update profile error:', error);

        return res.status(500).json({
            error: 'Failed to update profile',
            message: error.message
        });
    }
}


/*
|--------------------------------------------------------------------------
| GET USER POSTS
|--------------------------------------------------------------------------
*/
async function getUserPosts(req, res) {
    try {
        const { id } = req.params;

        const user = await UserModel.findById(id);

        if (!user) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        const posts = await PostModel.find({
            userId: id
        }).populate('userId', 'username image');

        return res.status(200).json({
            message: 'User posts fetched successfully',
            posts
        });

    } catch (error) {
        console.error('Get user posts error:', error);

        return res.status(500).json({
            error: 'Failed to fetch user posts',
            message: error.message
        });
    }
}


/*
|--------------------------------------------------------------------------
| FOLLOW USER
|--------------------------------------------------------------------------
*/
async function followUser(req, res) {
    try {
        const { id } = req.params;
        const currentUserId = req.userId;

        if (!currentUserId) {
            return res.status(401).json({
                error: 'Unauthorized'
            });
        }

        if (id === currentUserId.toString()) {
            return res.status(400).json({
                error: 'You cannot follow yourself'
            });
        }

        const userToFollow = await UserModel.findById(id);
        const currentUser = await UserModel.findById(currentUserId);

        if (!userToFollow) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        if (currentUser.following.includes(id)) {
            return res.status(400).json({
                error: 'You already follow this user'
            });
        }

        currentUser.following.push(id);
        userToFollow.followers.push(currentUserId);

        // Update counts
        currentUser.followingCount += 1;
        userToFollow.followersCount += 1;

        await currentUser.save();
        await userToFollow.save();

        return res.status(200).json({
            message: 'User followed successfully'
        });

    } catch (error) {
        console.error('Follow user error:', error);

        return res.status(500).json({
            error: 'Failed to follow user',
            message: error.message
        });
    }
}


/*
|--------------------------------------------------------------------------
| UNFOLLOW USER
|--------------------------------------------------------------------------
*/
async function unfollowUser(req, res) {
    try {
        const { id } = req.params;
        const currentUserId = req.userId;

        if (!currentUserId) {
            return res.status(401).json({
                error: 'Unauthorized'
            });
        }

        if (id === currentUserId.toString()) {
            return res.status(400).json({
                error: 'You cannot unfollow yourself'
            });
        }

        const userToUnfollow = await UserModel.findById(id);
        const currentUser = await UserModel.findById(currentUserId);

        if (!userToUnfollow) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        if (!currentUser.following.includes(id)) {
            return res.status(400).json({
                error: 'You do not follow this user'
            });
        }

        currentUser.following = currentUser.following.filter(followingId => followingId.toString() !== id);/* meri following ka andur alia hmed etc ha aur jo jis ko ma unfollow kuro ga us ki is ali,ahmed  hi ga agua m equal ho gaya tu delete*/
        userToUnfollow.followers = userToUnfollow.followers.filter(followerId => followerId.toString() !== currentUserId.toString());

        // Update counts
        currentUser.followingCount -= 1;
        userToUnfollow.followersCount -= 1;

        await currentUser.save();
        await userToUnfollow.save();

        return res.status(200).json({
            message: 'User unfollowed successfully'
        });

    } catch (error) {
        console.error('Unfollow user error:', error);

        return res.status(500).json({
            error: 'Failed to unfollow user',
            message: error.message
        });
    }
}


/*
|--------------------------------------------------------------------------
| GET FOLLOWERS
|--------------------------------------------------------------------------
*/
async function getFollowers(req, res) {
    try {
        const { id } = req.params;

        const user = await UserModel.findById(id)
            .populate('followers', 'username avatar bio')
            .select('-password');

        if (!user) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        return res.status(200).json({
            message: 'Followers fetched successfully',
            followers: user.followers
        });

    } catch (error) {
        console.error('Get followers error:', error);

        return res.status(500).json({
            error: 'Failed to fetch followers',
            message: error.message
        });
    }
}


/*
|--------------------------------------------------------------------------
| GET FOLLOWING
|--------------------------------------------------------------------------
*/
async function getFollowing(req, res) {
    try {
        const { id } = req.params;

        const user = await UserModel.findById(id)
            .populate('following', 'username avatar bio')
            .select('-password');

        if (!user) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        return res.status(200).json({
            message: 'Following fetched successfully',
            following: user.following
        });

    } catch (error) {
        console.error('Get following error:', error);

        return res.status(500).json({
            error: 'Failed to fetch following',
            message: error.message
        });
    }
}


module.exports = {
    getUserProfile,
    updateProfile,
    getUserPosts,
    followUser,
    unfollowUser,
    getFollowers,
    getFollowing
};
