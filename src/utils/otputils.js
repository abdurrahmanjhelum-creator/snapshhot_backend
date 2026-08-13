function generateOtp()
{
    return Math.floor(100000 + Math.random()*900000).toString();

}

function getOtphtml(otp)
{
    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Email Verification</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Your verification code is below</p>
            </div>
            <div style="background: #f9f9f9; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <div style="background: white; padding: 25px; border-radius: 8px; text-align: center; border: 2px dashed #667eea; margin-bottom: 20px;">
                    <p style="color: #666; margin: 0 0 10px 0; font-size: 14px;">Your verification code:</p>
                    <div style="font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 5px; margin: 0;">
                        ${otp}
                    </div>
                </div>
                <p style="color: #666; margin: 0; font-size: 14px; text-align: center;">
                    This code will expire in <strong>10 minutes</strong>.
                </p>
                <p style="color: #999; margin: 20px 0 0 0; font-size: 12px; text-align: center;">
                    If you didn't request this code, please ignore this email.
                </p>
            </div>
            <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
                <p style="margin: 0;">© 2024 Instagram App. All rights reserved.</p>
            </div>
        </div>
    `;
}

module.exports = {
    generateOtp,
    getOtphtml
};