import nodemailer from 'nodemailer';
import { randomBytes } from 'crypto';

interface VerificationEmailData {
  to: string;
  firstName: string;
  verificationCode: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null;
  private isConfigured: boolean;

  constructor() {
    // Check if Gmail SMTP configuration is available
    this.isConfigured = !!(
      process.env.GMAIL_USER && 
      process.env.GMAIL_PASS
    );

    if (this.isConfigured) {
      // Try multiple Gmail configurations for better compatibility
      const gmailConfig = {
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASS?.replace(/\s+/g, ''), // Remove all whitespace
        },
        tls: {
          rejectUnauthorized: false,
          ciphers: 'SSLv3'
        },
        requireTLS: true,
        debug: true,
        logger: true
      };

      this.transporter = nodemailer.createTransport(gmailConfig);
      console.log('📧 Gmail SMTP configured with user:', process.env.GMAIL_USER);
    } else {
      this.transporter = null;
      console.log('🔧 Email service running in development mode - Gmail SMTP not configured');
    }
  }

  generateVerificationCode(): string {
    // Generate a 6-digit numeric code
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendPasswordResetEmail(data: VerificationEmailData): Promise<boolean> {
    try {
      // If Gmail SMTP is not configured, use development mode
      if (!this.isConfigured || !this.transporter) {
        console.log('🔧 Development Mode - Password Reset Email (No SMTP config)');
        console.log('To:', data.to);
        console.log('Verification Code:', data.verificationCode);
        console.log('📧 Enter the verification code above to test password reset functionality');
        console.log('================================================================================');
        return true; // Return success for development
      }

      // Try to send actual Gmail
      console.log('📧 Attempting to send Gmail...');
      
      // Verify connection first
      try {
        await this.transporter.verify();
        console.log('✅ Gmail SMTP connection verified successfully');
      } catch (verifyError) {
        console.error('❌ Gmail SMTP verification failed:', verifyError);
        console.log('🔧 Falling back to development mode');
        console.log('To:', data.to);
        console.log('Verification Code:', data.verificationCode);
        console.log('📧 Gmail credentials may need to be updated - check account settings');
        console.log('================================================================================');
        return true; // Return success for development fallback
      }

      const htmlContent = this.getVerificationCodeEmailTemplate(data);
      
      const mailOptions = {
        from: {
          name: 'QueryLinker',
          address: process.env.GMAIL_USER!
        },
        to: data.to,
        subject: 'Password Reset Verification Code - QueryLinker',
        html: htmlContent,
        text: this.getVerificationCodeTextContent(data)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Password reset verification email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      return false;
    }
  }

  private getVerificationCodeEmailTemplate(data: VerificationEmailData): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset - QueryLinker</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background-color: #ffffff;
            border-radius: 10px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
        }
        .title {
            font-size: 24px;
            color: #1f2937;
            margin-bottom: 20px;
        }
        .content {
            font-size: 16px;
            color: #4b5563;
            margin-bottom: 30px;
        }
        .reset-button {
            display: inline-block;
            background-color: #2563eb;
            color: #ffffff;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
        }
        .reset-button:hover {
            background-color: #1d4ed8;
        }
        .security-note {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
            text-align: center;
        }
        .expiry-note {
            font-size: 14px;
            color: #ef4444;
            font-weight: 500;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">QueryLinker</div>
            <h1 class="title">Password Reset Verification</h1>
        </div>
        
        <div class="content">
            <p>Hello ${data.firstName || 'there'},</p>
            
            <p>We received a request to reset your password for your QueryLinker account. If you didn't make this request, you can safely ignore this email.</p>
            
            <p>Your verification code is:</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <div style="display: inline-block; background-color: #f3f4f6; border: 2px solid #2563eb; border-radius: 12px; padding: 20px 40px; font-family: 'Courier New', monospace; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #2563eb;">${data.verificationCode}</div>
            </div>
            
            <p style="text-align: center; font-size: 18px; font-weight: 600; color: #1f2937;">Enter this code in QueryLinker to reset your password</p>
            
            <div class="security-note">
                <strong>🔒 Security Notice:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>This verification code will expire in 10 minutes for your security</li>
                    <li>If you didn't request this reset, please contact our support team</li>
                    <li>Never share this code with anyone</li>
                </ul>
            </div>
            
            <p class="expiry-note">⏰ This verification code will expire in 10 minutes.</p>
        </div>
        
        <div class="footer">
            <p><strong>QueryLinker Team</strong></p>
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>If you need assistance, please contact our support team.</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  private getVerificationCodeTextContent(data: VerificationEmailData): string {
    return `
Password Reset Verification Code - QueryLinker

Hello ${data.firstName || 'there'},

We received a request to reset your password for your QueryLinker account. If you didn't make this request, you can safely ignore this email.

Your verification code is:

${data.verificationCode}

Enter this code in QueryLinker to reset your password.

SECURITY NOTICE:
- This verification code will expire in 10 minutes for your security
- If you didn't request this reset, please contact our support team
- Never share this code with anyone

This verification code will expire in 10 minutes.

Best regards,
QueryLinker Team

This is an automated message. Please do not reply to this email.
If you need assistance, please contact our support team.
    `;
  }

  async verifyConnection(): Promise<boolean> {
    try {
      if (!this.isConfigured || !this.transporter) {
        console.log('🔧 Development mode: Gmail SMTP verification skipped');
        return true;
      }
      
      await this.transporter.verify();
      console.log('Gmail SMTP connection verified successfully');
      return true;
    } catch (error) {
      console.error('Gmail SMTP connection failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();