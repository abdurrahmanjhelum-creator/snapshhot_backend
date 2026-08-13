const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    otpHash: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['email_verification', 'password_reset'],
        default: 'email_verification'
    },
    expiresAt: {
        type: Date,
        required: true,
        expires: 600 // 10 minutes in seconds - MongoDB TTL index
    }
}, { timestamps: true });

// Index for faster lookups
otpSchema.index({ email: 1, expiresAt: 1 });

const OTPModel = mongoose.model('OTP', otpSchema);

module.exports = OTPModel;
