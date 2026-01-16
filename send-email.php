<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $email = $data['email'];
    $code = $data['code'];
    $name = $data['name'];
    
    $MAILERSEND_API_TOKEN = 'mlsn.838c5d512f1cc1963ccd4b1e3c4fba46d6d384201043369adfe3da22d282f0d3';
    $MAILERSEND_FROM_EMAIL = 'MS_VrWHN5@test-68zxl27ex154j905.mlsender.net';
    
    $emailHTML = '<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; background-color: #f7f9fc;"><div style="max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px;"><div style="background: linear-gradient(135deg, #0A2540 0%, #1E4D7B 100%); padding: 40px 30px; text-align: center;"><div style="font-size: 32px; font-weight: 700; color: #ffffff;">Bitfinekinvest</div></div><div style="padding: 40px 30px;"><h1 style="color: #0A2540;">Welcome, ' . $name . '!</h1><div style="background: #f7f9fc; border: 2px solid #D4AF37; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0;"><div style="font-size: 48px; font-weight: 700; color: #0A2540; letter-spacing: 8px;">' . $code . '</div><div style="color: #1E4D7B; font-size: 14px; margin-top: 10px;">Your Verification Code</div></div><p style="color: #1E4D7B;">This code will expire in 15 minutes.</p></div></div></body></html>';
    
    $payload = json_encode([
        'from' => [
            'email' => $MAILERSEND_FROM_EMAIL,
            'name' => 'Bitfinekinvest'
        ],
        'to' => [[
            'email' => $email,
            'name' => $name
        ]],
        'subject' => 'Verify Your Email - Bitfinekinvest',
        'html' => $emailHTML,
        'text' => 'Your verification code is: ' . $code
    ]);
    
    $ch = curl_init('https://api.mailersend.com/v1/email');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $MAILERSEND_API_TOKEN
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    echo json_encode([
        'success' => $httpCode === 202,
        'code' => $httpCode,
        'response' => json_decode($response)
    ]);
}
?>