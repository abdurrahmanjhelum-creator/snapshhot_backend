const express = require('express');
const authrouter = require('./routes/auth.routes.js');
const postrouter = require('./routes/post.routes');
const likerouter = require('./routes/like.routes');
const commentrouter = require('./routes/comment.routes');
const userrouter = require('./routes/user.routes');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();

// Increase timeout for file uploads
app.use((req, res, next) => {
    res.setTimeout(120000); // 2 minutes timeout
    next();
});

// CORS configuration for both Web and Mobile
app.use(cors({
    origin: true, // Allow all origins (or specify your frontend URL)
    credentials: true, // Allow cookies to be sent
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(cookieParser());
app.use(express.json());

// Routes
app.use('/api/auth', authrouter);
app.use('/api/post', postrouter);
// Also mount plural route to be compatible with clients using /api/posts
app.use('/api/posts', postrouter);
app.use('/api/likes', likerouter);
app.use('/api/comments', commentrouter);
app.use('/api/user', userrouter);

module.exports = app;
