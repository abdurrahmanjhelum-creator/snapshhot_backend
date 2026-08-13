const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const likeController = require('../controller/like.controller');

const router = express.Router();

router.post('/:postId', authMiddleware, likeController.like);
    
router.delete('/:postId', authMiddleware, likeController.unlike);

router.get('/:postId', authMiddleware, likeController.getPostLikes);

module.exports = router;