const express = require('express');
const postcontroller = require('../controller/post.controller');
const commentController = require('../controller/comment.controller');
const multer = require('multer');
const authMiddleware = require('../middleware/auth.middleware');
const router = express.Router();

const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB max file size
    }
});

/* post add - Protected */
router.post('/create', authMiddleware, upload.single('image'), postcontroller.createPost);

/* post get - Public (Prevents 401 error for feed) */
router.get('/get', postcontroller.getPost);

/* toggle like on a post - Protected */
router.post('/:postId/like', authMiddleware, postcontroller.toggleLikePost);

/* get comments for a post - Protected */
router.get('/:postId/comments', authMiddleware, commentController.getComments);

/* post update - Protected */
router.patch('/update/:id', authMiddleware, upload.single('image'), postcontroller.updatePost);

/* post delete - Protected */
router.delete('/delete/:id', authMiddleware, postcontroller.deletePost);

/* post get my posts - Protected */
router.get('/my-posts', authMiddleware, postcontroller.getMyPost);

/* search posts - Public */
router.get('/search', postcontroller.searchPosts);

module.exports = router;
