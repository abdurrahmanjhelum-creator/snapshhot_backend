let io;

const initializeSocket = (server) => {
    io = require('socket.io')(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST', 'PUT', 'DELETE']
        }
    });

    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        socket.on('join-post', (postId) => {
            socket.join(`post-${postId}`);
            console.log(`Socket ${socket.id} joined post-${postId}`);
        });

        socket.on('leave-post', (postId) => {
            socket.leave(`post-${postId}`);
            console.log(`Socket ${socket.id} left post-${postId}`);
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
};

module.exports = {
    initializeSocket,
    getIO
};
