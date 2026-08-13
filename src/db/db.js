const mongoose = require('mongoose');

// Connection state listeners for real-time monitoring
mongoose.connection.on('connected', () => console.log('Mongoose connected to MongoDB'));
mongoose.connection.on('error', (err) => console.error('Mongoose connection error:', err.message));
mongoose.connection.on('disconnected', () => console.warn('Mongoose connection lost'));

async function connectDB() {
    // Return early if already connected
    if (mongoose.connection.readyState === 1) {
        return;
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 30000, // Increased timeout for MongoDB Atlas
            socketTimeoutMS: 60000, // Increased socket timeout
            maxPoolSize: 10,
            minPoolSize: 5,
            family: 4, // Force IPv4
        });
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Fatal: Failed to connect to MongoDB on startup:', error.message);
        // Throw the error back to server.js so the HTTP server does not start without DB
        throw error;
    }
}

module.exports = connectDB;