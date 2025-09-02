import nodemailer from 'nodemailer';
import { randomBytes } from 'crypto';

interface ResetEmailData {
  to: string;
  firstName: string;
  resetToken: string;
  resetUrl: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null;
  private isConfigured: boolean;

  constructor() {
    // Check if SMTP configuration is available
    this.isConfigured = !!(
      process.env.SMTP_HOST && 
      process.env.SMTP_USER && 
      process.env.SMTP_PASS
    );

    if (this.isConfigured) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        tls: {
          rejectUnauthorized: false
        }
      });
    } else {
      this.transporter = null;
      console.log('🔧 Email service running in development mode - SMTP not configured');
    }
  }

  generateResetToken(): string {
    return randomBytes(32).toString('hex');
  }

  async sendPasswordResetEmail(data: ResetEmailData): Promise<boolean> {
    try {
      // If SMTP is not configured, use development mode
      if (!this.isConfigured || !this.transporter) {
        console.log('🔧 Development Mode - Password Reset Email');
        console.log('To:', data.to);
        console.log('Reset URL:', data.resetUrl);
        console.log('Reset Token:', data.resetToken);
        console.log('📧 In production, this would be sent via email');
        return true; // Return success for development
      }

      const htmlContent = this.getPasswordResetEmailTemplate(data);
      
      const mailOptions = {
        from: {
          name: 'QueryLinker',
          address: process.env.SMTP_USER!
        },
        to: data.to,
        subject: 'Password Reset Request - QueryLinker',
        html: htmlContent,
        text: this.getPasswordResetTextContent(data)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Password reset email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      return false;
    }
  }

  private getPasswordResetEmailTemplate(data: ResetEmailData): string {
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
            <h1 class="title">Password Reset Request</h1>
        </div>
        
        <div class="content">
            <p>Hello ${data.firstName || 'there'},</p>
            
            <p>We received a request to reset your password for your QueryLinker account. If you didn't make this request, you can safely ignore this email.</p>
            
            <p>To reset your password, click the button below:</p>
            
            <div style="text-align: center;">
                <a href="${data.resetUrl}" class="reset-button">Reset Your Password</a>
            </div>
            
            <div class="security-note">
                <strong>🔒 Security Notice:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>This link will expire in 1 hour for your security</li>
                    <li>If you didn't request this reset, please contact our support team</li>
                    <li>Never share this link with anyone</li>
                </ul>
            </div>
            
            <p class="expiry-note">⏰ This reset link will expire in 60 minutes.</p>
            
            <p>If the button above doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background-color: #f3f4f6; padding: 10px; border-radius: 4px; font-family: monospace;">${data.resetUrl}</p>
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

  private getPasswordResetTextContent(data: ResetEmailData): string {
    return `
Password Reset Request - QueryLinker

Hello ${data.firstName || 'there'},

We received a request to reset your password for your QueryLinker account. If you didn't make this request, you can safely ignore this email.

To reset your password, visit this link:
${data.resetUrl}

SECURITY NOTICE:
- This link will expire in 1 hour for your security
- If you didn't request this reset, please contact our support team
- Never share this link with anyone

This reset link will expire in 60 minutes.

Best regards,
QueryLinker Team

This is an automated message. Please do not reply to this email.
If you need assistance, please contact our support team.
    `;
  }

  async verifyConnection(): Promise<boolean> {
    try {
      if (!this.isConfigured || !this.transporter) {
        console.log('🔧 Development mode: SMTP verification skipped');
        return true;
      }
      
      await this.transporter.verify();
      console.log('SMTP connection verified successfully');
      return true;
    } catch (error) {
      console.error('SMTP connection failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();