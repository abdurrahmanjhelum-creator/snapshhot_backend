const jwt = require('jsonwebtoken');

// ⭐ Access Token - 15 minute ke liye valid
function generateAccessToken(userId) {
    return jwt.sign(
        { id: userId },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '15m' }  // 15 minutes
    );
}

// ⭐ Refresh Token - 7 din ke liye valid
function generateRefreshToken(userId) {
    return jwt.sign(
        { id: userId },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '7d' }  // 7 days
    );
}

// ⭐ Access Token Verify
function verifyAccessToken(token) {
    try {
        return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch (error) {
        return null;
    }
}

// ⭐ Refresh Token Verify
function verifyRefreshToken(token) {
    try {
        return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    } catch (error) {
        return null;
    }
}

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken
};
