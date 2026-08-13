const authModel = require('../models/auth.model.js');
const PostModel = require('../models/post.model');
const otpModel = require('../models/otp.model');
const bcrypt = require('bcrypt');

const {

    generateAccessToken,

    generateRefreshToken,

    verifyRefreshToken

} = require('../utils/tokenUtils');



const { generateOtp, getOtphtml } = require('../utils/otputils');

const emailService = require('../services/email_service');



// ✅ 1. REGISTER USER (without OTP - OTP sent separately)

async function registerUser(req, res) {

    try {

        const { username, email, password } = req.body;



        // Validation

        if (!username || !email || !password) {

            return res.status(400).json({

                message: 'Please provide all fields'

            });

        }



        // Check if user exists

        const userExists = await authModel.findOne({

           email

        });



        if (userExists) {

            return res.status(400).json({

                message: 'User already exists'

            });

        }



        // Hash password

        const hashedPassword = await bcrypt.hash(password, 10);



        // Create user (unverified)

        const user = await authModel.create({

            username,

            email,

            password: hashedPassword,

            verified: false

        });



        // Generate OTP

        const otp = generateOtp();

        const html = getOtphtml(otp);

        const otpHash = await bcrypt.hash(otp, 10);



        // Store OTP in database with type 'email_verification'

        await otpModel.create({

            email,

            user: user._id,

            otpHash,

            type: 'email_verification',
            expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now

        });



        // Send OTP email

        await emailService.sendOTPEmail(email, "Otp verification", `Your otp code is ${otp}`, html);



        const userResponse = user.toObject();

        delete userResponse.password;



        res.status(201).json({

            message: 'User created successfully. Please verify your email.',

            user: userResponse

        });

    } catch (error) {

        res.status(500).json({

            message: 'Registration failed',

            error: error.message

        });

    }

}



// ✅ VERIFY EMAIL WITH OTP

async function verifyEmail(req, res) {

    try {

        const { email, otp } = req.body;



        if (!email || !otp) {

            return res.status(400).json({

                message: 'Email and OTP are required'

            });

        }



        // Find OTP record for email verification

        const otpDoc = await otpModel.findOne({ 

            email, 

            type: 'email_verification' 

        });



        if (!otpDoc) {

            return res.status(400).json({

                message: 'Invalid or expired OTP'

            });

        }

        // Check if OTP has expired
        if (otpDoc.expiresAt < new Date()) {
            return res.status(400).json({
                message: 'OTP has expired'
            });
        }



        // Verify OTP hash

        const isOtpValid = await bcrypt.compare(otp, otpDoc.otpHash);



        if (!isOtpValid) {

            return res.status(400).json({

                message: 'Invalid OTP'

            });

        }



        // Update user as verified

        const user = await authModel.findByIdAndUpdate(

            otpDoc.user,

            { verified: true },

            { new: true }

        );



        // Delete OTP records for this user

        await otpModel.deleteMany({ user: otpDoc.user });



        const userResponse = user.toObject();

        delete userResponse.password;



        res.status(200).json({

            message: 'Email verified successfully',

            user: userResponse

        });

    } catch (error) {

        res.status(500).json({

            message: 'Verification failed',

            error: error.message

        });

    }

}



// ✅ RESEND OTP - For unverified users

async function resendOTP(req, res) {

    try {

        const { email } = req.body;



        if (!email) {

            return res.status(400).json({

                message: 'Email is required'

            });

        }



        // Find user by email

        const user = await authModel.findOne({ email });



        if (!user) {

            return res.status(404).json({

                message: 'User not found'

            });

        }



        // Check if already verified

        if (user.verified) {

            return res.status(400).json({

                message: 'Account is already verified'

            });

        }



        // Generate new OTP

        const otp = generateOtp();

        const html = getOtphtml(otp);

        const otpHash = await bcrypt.hash(otp, 10);



        // Delete old OTP records for this user (for email verification)

        await otpModel.deleteMany({ user: user._id, type: 'email_verification' });



        // Store new OTP with type 'email_verification'

        await otpModel.create({

            email,

            user: user._id,

            otpHash,

            type: 'email_verification',
            expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now

        });



        // Send OTP email

        await emailService.sendOTPEmail(email, "Otp verification", `Your otp code is ${otp}`, html);



        res.status(200).json({

            message: 'OTP sent successfully'

        });

    } catch (error) {

        res.status(500).json({

            message: 'Failed to resend OTP',

            error: error.message

        });

    }

}



// ✅ 2. LOGIN - Dono tokens generate karein

async function login(req, res) {

    try {

        const { email, password } = req.body;



        // Find user

        const user = await authModel.findOne({ email });

        if (!user) {

            return res.status(400).json({

                message: 'Invalid credentials'

            });

        }



        // Check password

        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {

            return res.status(400).json({

                message: 'Invalid credentials'

            });

        }



        // Check if user is verified

        if (!user.verified) {

            return res.status(403).json({

                message: 'Account not verified',

                requiresVerification: true,

                email: user.email

            });

        }



        // ⭐⭐ GENERATE TOKENS ⭐⭐

        const accessToken = generateAccessToken(user._id);

        const refreshToken = generateRefreshToken(user._id);



        // ⭐ 1. REFRESH TOKEN COOKIE MEIN SET KAREIN

        res.cookie('refreshToken', refreshToken, {

            httpOnly: true,

            secure: false,

            sameSite: 'lax',

            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days

        });



        // ⭐ 2. Response mein access token bhejein

        const userResponse = user.toObject();

        delete userResponse.password;

        // postCount is now stored in the database and updated automatically

        res.json({

            message: 'Login successful',

            accessToken: accessToken,

            user: userResponse

        });



    } catch (error) {

        res.status(500).json({

            message: 'Login failed',

            error: error.message

        });

    }

}



// ✅ 3. REFRESH TOKEN - WITH ROTATION (Naya refresh token bhi generate karein)

async function refreshToken(req, res) {

    try {

        // ⭐ 1. Cookie se purana refresh token lein

        const oldRefreshToken = req.cookies.refreshToken;



        // Agar refresh token nahi mila

        if (!oldRefreshToken) {

            return res.status(401).json({

                message: 'No refresh token found'

            });

        }



        // ⭐ 2. Purana refresh token verify karein

        const decoded = verifyRefreshToken(oldRefreshToken);

        

        // Agar refresh token invalid/expire ho gaya

        if (!decoded) {

            return res.status(403).json({

                message: 'Invalid or expired refresh token'

            });

        }



        // ⭐ 3. Naya access token generate karein

        const newAccessToken = generateAccessToken(decoded.id);



        // ⭐ 4. Naya refresh token generate karein (ROTATION)

        const newRefreshToken = generateRefreshToken(decoded.id);



        // ⭐ 5. Purani refresh token cookie ko naye se replace karein

        res.cookie('refreshToken', newRefreshToken, {

            httpOnly: true,

            secure: false,      // Production mein true karein

            sameSite: 'lax',

            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days

        });



        // ⭐ 6. Naya access token response mein bhejein

        res.json({

            message: 'Token refreshed successfully',

            accessToken: newAccessToken

            // Refresh token auto cookie mein update ho jayega

        });



    } catch (error) {

        res.status(500).json({

            message: 'Refresh failed',

            error: error.message

        });

    }

}



// ✅ 4. LOGOUT - Cookie clear karein

async function logout(req, res) {

    try {

        // ⭐ Refresh token cookie clear karein

        res.clearCookie('refreshToken');

        

        res.json({

            message: 'Logged out successfully'

        });

    } catch (error) {

        res.status(500).json({

            message: 'Logout failed',

            error: error.message

        });

    }

}



// ✅ 5. FORGOT PASSWORD - OTP send karein password reset ke liye

async function forgotPassword(req, res) {

    try {

        const { email } = req.body;



        // Validation

        if (!email) {

            return res.status(400).json({

                message: 'Email is required'

            });

        }



        // Check if user exists

        const user = await authModel.findOne({ email });



        if (!user) {

            return res.status(404).json({

                message: 'User not found with this email'

            });

        }



        // Generate OTP

        const otp = generateOtp();

        const html = getOtphtml(otp);

        const otpHash = await bcrypt.hash(otp, 10);



        // Delete old OTP records for this user (for password reset)

        await otpModel.deleteMany({ email, type: 'password_reset' });



        // Store OTP in database with type 'password_reset'

        await otpModel.create({

            email,

            user: user._id,

            otpHash,

            type: 'password_reset', // OTP type distinguish karein
            expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now

        });



        // Send OTP email

        await emailService.sendOTPEmail(email, "Password Reset OTP", `Your password reset OTP code is ${otp}`, html);



        res.status(200).json({

            message: 'Password reset OTP sent successfully',

            email: email

        });

    } catch (error) {

        res.status(500).json({

            message: 'Failed to send password reset OTP',

            error: error.message

        });

    }

}



// ✅ 6. RESET PASSWORD - OTP verify karke password reset karein

async function resetPassword(req, res) {

    try {

        const { email, otp, newPassword } = req.body;



        // Validation

        if (!email || !otp || !newPassword) {

            return res.status(400).json({

                message: 'Email, OTP, and new password are required'

            });

        }



        // Find OTP record for password reset

        const otpDoc = await otpModel.findOne({ 

            email, 

            type: 'password_reset' 

        });



        if (!otpDoc) {

            return res.status(400).json({

                message: 'Invalid or expired OTP'

            });

        }

        // Check if OTP has expired
        if (otpDoc.expiresAt < new Date()) {
            return res.status(400).json({
                message: 'OTP has expired'
            });
        }



        // Verify OTP hash

        const isOtpValid = await bcrypt.compare(otp, otpDoc.otpHash);



        if (!isOtpValid) {

            return res.status(400).json({

                message: 'Invalid OTP'

            });

        }



        // Hash new password

        const hashedPassword = await bcrypt.hash(newPassword, 10);



        // Update user password

        const user = await authModel.findByIdAndUpdate(

            otpDoc.user,

            { password: hashedPassword },

            { new: true }

        );



        if (!user) {

            return res.status(404).json({

                message: 'User not found'

            });

        }



        // Delete OTP records for this user

        await otpModel.deleteMany({ user: otpDoc.user });



        res.status(200).json({

            message: 'Password reset successfully'

        });

    } catch (error) {

        res.status(500).json({

            message: 'Password reset failed',

            error: error.message

        });

    }

}



module.exports = {

    registerUser,

    verifyEmail,

    resendOTP,

    login,

    refreshToken,

    logout,

    forgotPassword,

    resetPassword

};

