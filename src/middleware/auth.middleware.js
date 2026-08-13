const { verifyAccessToken } = require('../utils/tokenUtils');

async function authMiddleware(req, res, next) {
    try {
        // ⭐ 1. Authorization header se token lein
        let token = req.headers.authorization;

        if (!token) {
            return res.status(401).json({
                message: 'Unauthorized - No token provided'
            });
        }

        // ⭐ 2. "Bearer " prefix hatao
        if (token.startsWith('Bearer ')) {
            token = token.split(' ')[1];
        } else {
            return res.status(401).json({
                message: 'Unauthorized - Invalid token format'
            });
        }

        // ⭐ 3. Access token verify karein
        const decoded = verifyAccessToken(token);

        if (!decoded) {
            return res.status(401).json({
                message: 'Unauthorized - Invalid or expired token'
            });
        }

        // ⭐ 4. User ID request mein add karein
        req.userId = decoded.id;
        next();

    } catch (error) {
        return res.status(401).json({
            message: 'Unauthorized - Authentication failed'
        });
    }
}

module.exports = authMiddleware;
