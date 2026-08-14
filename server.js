require('dotenv').config();

const app = require('./src/app.js');
const connectDB = require('./src/db/db.js');
const { initializeSocket } = require('./src/utils/socket.js');

// Connect to MongoDB
connectDB();

// Start server on all network interfaces
const server = app.listen(3000, '0.0.0.0', () => {
    console.log(`Server is running on port 3000`);
});

// Initialize Socket.io
initializeSocket(server);
