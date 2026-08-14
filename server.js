require('dotenv').config();

const app = require('./src/app.js');
const connectDB = require('./src/db/db.js');
const { initializeSocket } = require('./src/utils/socket.js');

// Connect to MongoDB
connectDB();

const PORT = process.env.PORT || 3000;

// Start server on all network interfaces
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});

// Initialize Socket.io
initializeSocket(server);
