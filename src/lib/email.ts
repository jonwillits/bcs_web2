// Email service using Resend
// Supports console logging for development and Resend for production

interface EmailConfig {
  provider: 'console' | 'resend';
  from: string;
  fromName?: string;
}

interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Get email configuration from environment
const getEmailConfig = (): EmailConfig => {
  const provider = process.env.EMAIL_PROVIDER || 'console';
  const from = process.env.EMAIL_FROM || 'onboarding@resend.dev';
  const fromName = process.env.EMAIL_FROM_NAME || 'BCS E-Learning';

  return {
    provider: provider as EmailConfig['provider'],
    from,
    fromName
  };
};

// Email template generator
const generateEmailTemplate = (title: string, content: string, actionUrl?: string, actionText?: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
        .content { padding: 40px 30px; }
        .content h2 { color: #333; margin-top: 0; }
        .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        .footer { background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef; color: #6c757d; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎓 BCS E-Learning</h1>
        </div>
        <div class="content">
          <h2>${title}</h2>
          ${content}
          ${actionUrl && actionText ? `<div style="text-align: center; margin: 30px 0;"><a href="${actionUrl}" class="button">${actionText}</a></div>` : ''}
        </div>
        <div class="footer">
          <p>BCS E-Learning Platform</p>
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Console email sending (for development)
const sendConsoleEmail = async (emailData: EmailData): Promise<void> => {
  console.log('\n📧 EMAIL SENT (Development Mode)');
  console.log('=====================================');
  console.log(`To: ${emailData.to}`);
  console.log(`Subject: ${emailData.subject}`);
  console.log(`HTML Content:\n${emailData.html}`);
  if (emailData.text) {
    console.log(`Text Content:\n${emailData.text}`);
  }
  console.log('=====================================\n');
};

// Resend email sending
const sendResendEmail = async (emailData: EmailData, config: EmailConfig): Promise<void> => {
  try {
    const { Resend } = await import('resend');

    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: `${config.fromName || 'BCS E-Learning'} <${config.from}>`,
      to: emailData.to,
      subject: emailData.subject,
      text: emailData.text,
      html: emailData.html,
    });
  } catch (error) {
    console.error('Resend email error:', error);
    throw new Error(`Failed to send email via Resend: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Main email sending function
export const sendEmail = async (emailData: EmailData): Promise<void> => {
  const config = getEmailConfig();

  switch (config.provider) {
    case 'console':
      await sendConsoleEmail(emailData);
      break;
    case 'resend':
      await sendResendEmail(emailData, config);
      break;
    default:
      throw new Error(`Unknown email provider: ${config.provider}`);
  }
};

// Email verification email
export const sendVerificationEmail = async (email: string, name: string, token: string): Promise<void> => {
  const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${token}`;

  const html = generateEmailTemplate(
    'Verify Your Email Address',
    `
      <p>Hi ${name},</p>
      <p>Thank you for registering with the BCS E-Learning platform! To complete your account setup, please verify your email address by clicking the button below.</p>
      <p>This verification link will expire in 24 hours for security purposes.</p>
      <p>If you didn't create an account, you can safely ignore this email.</p>
    `,
    verificationUrl,
    'Verify Email Address'
  );

  await sendEmail({
    to: email,
    subject: 'Verify Your BCS E-Learning Account',
    html,
    text: `Hi ${name}, please verify your email by visiting: ${verificationUrl}`
  });
};

// Password reset email
export const sendPasswordResetEmail = async (email: string, name: string, token: string): Promise<void> => {
  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;

  const html = generateEmailTemplate(
    'Reset Your Password',
    `
      <p>Hi ${name},</p>
      <p>You requested to reset your password for your BCS E-Learning account. Click the button below to create a new password.</p>
      <p><strong>This reset link will expire in 1 hour</strong> for security purposes.</p>
      <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
    `,
    resetUrl,
    'Reset Password'
  );

  await sendEmail({
    to: email,
    subject: 'Reset Your BCS E-Learning Password',
    html,
    text: `Hi ${name}, reset your password by visiting: ${resetUrl}`
  });
};