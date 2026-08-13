const express = require('express');
const commentController = require('../controller/comment.controller');
const authMiddleware = require('../middleware/auth.middleware');
const router = express.Router();

/* Add comment */
router.post('/add/:postId', authMiddleware, commentController.addComment);

/* Get comments for a post */
router.get('/post/:postId', authMiddleware, commentController.getComments);

/* Delete comment */
router.delete('/delete/:commentId', authMiddleware, commentController.deleteComment);

/* Update comment */
router.put('/update/:commentId', authMiddleware, commentController.updateComment);

module.exports = router;