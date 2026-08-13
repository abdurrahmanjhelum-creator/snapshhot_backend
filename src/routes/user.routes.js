const express = require('express');
const router = express.Router();
const userController = require('../controller/user.controller');
const authMiddleware = require('../middleware/auth.middleware');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

// GET user profile by ID
router.get('/profile/:id', userController.getUserProfile);

// GET user posts by ID
router.get('/posts/:id', userController.getUserPosts);

// Update own profile (requires authentication)
router.put('/update', authMiddleware, upload.single('image'), userController.updateProfile);

// Follow user (requires authentication)
router.post('/follow/:id', authMiddleware, userController.followUser);

// Unfollow user (requires authentication)
router.post('/unfollow/:id', authMiddleware, userController.unfollowUser);

// Get user's followers
router.get('/followers/:id', userController.getFollowers);

// Get user's following
router.get('/following/:id', userController.getFollowing);

module.exports = router;
