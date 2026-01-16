export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { email, code, name } = req.body;

        // Validate input
        if (!email || !code || !name) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const MAILERSEND_API_TOKEN = 'mlsn.838c5d512f1cc1963ccd4b1e3c4fba46d6d384201043369adfe3da22d282f0d3';
        const MAILERSEND_FROM_EMAIL = 'MS_VrWHN5@test-68zxl27ex154j905.mlsender.net';

        const emailHTML = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: Arial, sans-serif; background-color: #f7f9fc; margin: 0; padding: 0;">
    <div style="max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(10, 37, 64, 0.1);">
        <div style="background: linear-gradient(135deg, #0A2540 0%, #1E4D7B 100%); padding: 40px 30px; text-align: center;">
            <div style="font-size: 32px; font-weight: 700; color: #ffffff; margin-bottom: 10px;">Bitfinekinvest</div>
            <div style="color: #F4E5B2; font-size: 14px;">Secure Crypto Investment</div>
        </div>
        <div style="padding: 40px 30px;">
            <h1 style="color: #0A2540; font-size: 24px; margin-bottom: 20px;">Welcome, ${name}!</h1>
            <p style="color: #1E4D7B; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">Thank you for registering with Bitfinekinvest. To complete your account setup, please verify your email address using the code below:</p>
            <div style="background: linear-gradient(135deg, #f7f9fc 0%, #ffffff 100%); border: 2px solid #D4AF37; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0;">
                <div style="font-size: 48px; font-weight: 700; color: #0A2540; letter-spacing: 8px; font-family: Courier New, monospace;">${code}</div>
                <div style="color: #1E4D7B; font-size: 14px; margin-top: 10px;">Your Verification Code</div>
            </div>
            <p style="color: #1E4D7B; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">Enter this code on the verification page to activate your account and start investing.</p>
            <div style="background: rgba(245, 158, 11, 0.1); border-left: 4px solid #D4AF37; padding: 15px; border-radius: 4px; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px; color: #1E4D7B;"><strong>⚠️ Warning:</strong> This code will expire in 15 minutes. If you did not request this verification, please ignore this email.</p>
            </div>
            <p style="color: #1E4D7B; font-size: 16px; line-height: 1.6;">If you have any questions, feel free to contact our support team.</p>
        </div>
        <div style="background: #f7f9fc; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 14px; color: #1E4D7B; margin: 5px 0;"><strong>Bitfinekinvest</strong></p>
            <p style="font-size: 14px; color: #1E4D7B; margin: 5px 0;">Secure Crypto Investment Platform</p>
            <p style="font-size: 12px; margin-top: 15px; color: #1E4D7B;">© 2026 Bitfinekinvest. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;

        const response = await fetch('https://api.mailersend.com/v1/email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${MAILERSEND_API_TOKEN}`
            },
            body: JSON.stringify({
                from: {
                    email: MAILERSEND_FROM_EMAIL,
                    name: 'Bitfinekinvest'
                },
                to: [{
                    email: email,
                    name: name
                }],
                subject: 'Verify Your Email - Bitfinekinvest',
                html: emailHTML,
                text: `Welcome to Bitfinekinvest! Your verification code is: ${code}. This code will expire in 15 minutes.`
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('MailerSend error:', errorData);
            return res.status(500).json({
                success: false,
                error: 'Failed to send email',
                details: errorData
            });
        }

        console.log('✅ Email sent successfully to:', email);

        return res.status(200).json({
            success: true,
            message: 'Email sent successfully'
        });

    } catch (error) {
        console.error('❌ Function error:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}