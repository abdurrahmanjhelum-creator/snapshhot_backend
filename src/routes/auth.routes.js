const express = require('express');
const authcontroller=require('../controller/auth.controller')
const authMiddleware=require('../middleware/auth.middleware')


const router = express.Router();


/*post*/
/*register user - no middleware needed*/
router.post('/register', authcontroller.registerUser);

/*post*/
/*verify email with OTP - no middleware needed*/
router.post('/verify-email', authcontroller.verifyEmail);

/*post*/
/*resend OTP - no middleware needed*/
router.post('/resend-otp', authcontroller.resendOTP);

/*post*/
/*login user - no middleware needed (user gets token here) */
router.post('/login', authcontroller.login);

// ✅ Refresh Token Route (No middleware - cookie se kaam chalega)
router.post('/refresh-token', authcontroller.refreshToken);

// ✅ Logout - No middleware needed (cookie se kaam chalega)
router.post('/logout', authcontroller.logout);

// ✅ Forgot Password - No middleware needed
router.post('/forgot-password', authcontroller.forgotPassword);

// ✅ Reset Password - No middleware needed (includes OTP verification)
router.post('/reset-password', authcontroller.resetPassword);


module.exports = router


