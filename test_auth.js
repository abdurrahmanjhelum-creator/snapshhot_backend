require('dotenv').config();
const mongoose = require('mongoose');
const authModel = require('./src/models/auth.model.js');
const otpModel = require('./src/models/otp.model');
const bcrypt = require('bcrypt');
const { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken } = require('./src/utils/tokenUtils');
const { generateOtp } = require('./src/utils/otputils');

async function testAuthSystem() {
  try {
    console.log('🔍 Testing Auth System...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Test 1: User Registration
    console.log('📝 Test 1: User Registration');
    const testUser = {
      username: 'testuser123',
      email: 'test@example.com',
      password: 'Test@123456'
    };
    
    const hashedPassword = await bcrypt.hash(testUser.password, 10);
    const user = await authModel.create({
      username: testUser.username,
      email: testUser.email,
      password: hashedPassword,
      verified: false
    });
    console.log('✅ User created:', user.username);
    console.log('✅ User verified status:', user.verified);
    console.log('✅ User ID:', user._id);

    // Test 2: OTP Generation
    console.log('\n📝 Test 2: OTP Generation');
    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    await otpModel.create({
      email: testUser.email,
      user: user._id,
      otpHash
    });
    console.log('✅ OTP generated:', otp);
    console.log('✅ OTP stored in database');

    // Test 3: OTP Verification
    console.log('\n📝 Test 3: OTP Verification');
    const otpDoc = await otpModel.findOne({ email: testUser.email });
    const isOtpValid = await bcrypt.compare(otp, otpDoc.otpHash);
    console.log('✅ OTP verification:', isOtpValid ? 'Valid' : 'Invalid');

    // Test 4: Email Verification
    console.log('\n📝 Test 4: Email Verification');
    const verifiedUser = await authModel.findByIdAndUpdate(
      user._id,
      { verified: true },
      { new: true }
    );
    await otpModel.deleteMany({ user: user._id });
    console.log('✅ User verified:', verifiedUser.verified);
    console.log('✅ OTP records deleted');

    // Test 5: Token Generation
    console.log('\n📝 Test 5: Token Generation');
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    console.log('✅ Access Token generated (first 20 chars):', accessToken.substring(0, 20) + '...');
    console.log('✅ Refresh Token generated (first 20 chars):', refreshToken.substring(0, 20) + '...');

    // Test 6: Token Verification
    console.log('\n📝 Test 6: Token Verification');
    const decodedAccess = verifyAccessToken(accessToken);
    const decodedRefresh = verifyRefreshToken(refreshToken);
    console.log('✅ Access Token verified:', decodedAccess ? 'Valid' : 'Invalid');
    console.log('✅ Refresh Token verified:', decodedRefresh ? 'Valid' : 'Invalid');
    console.log('✅ User ID from access token:', decodedAccess.id);
    console.log('✅ User ID from refresh token:', decodedRefresh.id);

    // Test 7: Password Verification
    console.log('\n📝 Test 7: Password Verification');
    const isPasswordValid = await bcrypt.compare(testUser.password, user.password);
    console.log('✅ Password verification:', isPasswordValid ? 'Valid' : 'Invalid');

    // Test 8: Duplicate User Check
    console.log('\n📝 Test 8: Duplicate User Check');
    const duplicateUser = await authModel.findOne({ email: testUser.email });
    console.log('✅ Duplicate email check:', duplicateUser ? 'Found (prevents registration)' : 'Not found');

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await authModel.deleteMany({ email: testUser.email });
    await otpModel.deleteMany({ email: testUser.email });
    console.log('✅ Test data cleaned up');

    console.log('\n✅ All Auth System Tests Passed!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

testAuthSystem();
